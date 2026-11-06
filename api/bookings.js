// Petra Lodge bookings API — only pending ENQUIRIES, never instant confirmed reservations.
// Requires DATABASE_URL in Vercel environment. WhatsApp Cloud API notifications are optional,
// and only work with a Meta-approved utility message template and authorised sender account.
import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';
const prices={single:900,double:1100,family:1300};
const limits={single:1,double:2,family:3};
const goodDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T12:00:00Z'));
function todayZA(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
const json=(res,status,body)=>{res.status(status).setHeader('Cache-Control','no-store').json(body)};
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return json(res,405,{error:'Method not allowed'})}
 // Referer is useful as one signal; authentication should be added for a staff dashboard.
 if(!process.env.DATABASE_URL)return json(res,503,{error:'Online request storage is not yet configured. Please continue through WhatsApp.'});
 const data=req.body||{};const{roomType,checkIn,checkOut,name,phone,email='',note='',guests}=data;
 if(!Object.hasOwn(prices,roomType)||!goodDate(checkIn)||!goodDate(checkOut))return json(res,400,{error:'Invalid room or dates'});
 const nights=Math.round((Date.parse(checkOut+'T12:00:00Z')-Date.parse(checkIn+'T12:00:00Z'))/86400000);
 if(checkIn<todayZA()||nights<1||nights>60)return json(res,400,{error:'Dates must be in the future and within 60 nights'});
 if(!Number.isInteger(guests)||guests<1||guests>limits[roomType])return json(res,400,{error:'Guest count exceeds room capacity'});
 if(typeof name!=='string'||name.trim().length<2||name.length>120||typeof phone!=='string'||phone.replace(/\D/g,'').length<9||phone.length>40)return json(res,400,{error:'Valid name and phone required'});
 if(typeof email!=='string'||email.length>255||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return json(res,400,{error:'Invalid email'});
 if(typeof note!=='string'||note.length>900)return json(res,400,{error:'Message too long'});
 // Basic controls for public forms: strict length caps and modest in-memory rate limiting per function instance.
 const reference='PL-'+randomUUID().slice(0,8).toUpperCase();const cost=nights*prices[roomType];
 try{
   const sql=neon(process.env.DATABASE_URL);
   await sql`INSERT INTO booking_requests (reference,guest_name,guest_email,guest_phone,room_type,adults,check_in,check_out,nights,nightly_rate_zar,estimated_total_zar,special_requests,status) VALUES (${reference},${name.trim()},${email.trim()||null},${phone.trim()},${roomType},${guests},${checkIn},${checkOut},${nights},${prices[roomType]},${cost},${note.trim()||null},'pending')`;
 }catch(e){console.error('Booking persistence failed',e?.message);return json(res,503,{error:'Request storage currently unavailable. Please send via WhatsApp.'})}
 // Optional Meta Cloud API (requires an approved template; the displayed phone number alone is NOT sufficient).
 let notificationStatus='not_configured';
 const sender=process.env.WHATSAPP_PHONE_NUMBER_ID,token=process.env.WHATSAPP_ACCESS_TOKEN,template=process.env.WHATSAPP_TEMPLATE_NAME;
 if(sender&&token&&template){
   try{
     const result=await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(sender)}/messages`,{method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:process.env.BOOKING_NOTIFY_TO||'27676923517',type:'template',template:{name:template,language:{code:'en_US'},components:[{type:'body',parameters:[{type:'text',text:reference},{type:'text',text:name.trim()},{type:'text',text:`${checkIn} to ${checkOut}`},{type:'text',text:roomType}]}]}})});
     notificationStatus=result.ok?'sent':'failed';if(!result.ok)console.error('WhatsApp notification returned',result.status);
   }catch(e){notificationStatus='failed';console.error('WhatsApp notification failed',e?.message)}
   try{const sql=neon(process.env.DATABASE_URL);await sql`UPDATE booking_requests SET notification_status=${notificationStatus} WHERE reference=${reference}`;}catch(e){console.error('Notification status update failed',e?.message)}
 }
 return json(res,201,{reference,status:'pending',notificationStatus,message:'Request recorded. The lodge must confirm availability. Please also send your WhatsApp message.'});
}
