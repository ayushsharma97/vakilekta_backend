// const admin = require('../config/firebase');
// const AdvocateUser = require('../models/AdvocateUser');

// exports.sendBulkNotification = async (req, res) => {
//   try {
//     const { title, body, imageUrl } = req.body;

//     if (!title || !body) {
//       return res.status(400).json({
//         message: 'Title and body are required',
//       });
//     }

//     // 1️⃣ Fetch users with FCM tokens
//     const users = await AdvocateUser.find({
//       fcmTokens: { $exists: true, $ne: [] },
//     }).select('fcmTokens');

//     // 2️⃣ Flatten + filter tokens
//     const tokens = users
//       .flatMap(u => u.fcmTokens)
//       .filter(t => typeof t === 'string' && t.length > 20);

//     if (!tokens.length) {
//       return res.status(400).json({
//         message: 'No valid FCM tokens found',
//       });
//     }

//     // 3️⃣ Firebase payload
//     const message = {
//       notification: {
//         title,
//         body,
//         image: imageUrl || undefined,
//       },
//       android: {
//         notification: {
//           imageUrl,
//           sound: 'default',
//         },
//       },
//       apns: {
//         payload: {
//           aps: {
//             sound: 'default',
//           },
//         },
//         fcm_options: {
//           image: imageUrl,
//         },
//       },
//       tokens, // ✅ MUST be flat array
//     };

//     // 4️⃣ Send notification
//     const response = await admin.messaging().sendEachForMulticast(message);

//     console.log(
//       response.responses.map((r, i) => ({
//         token: tokens[i],
//         success: r.success,
//         error: r.error?.message,
//         code: r.error?.code,
//       }))
//     );

//     res.json({
//       message: 'Notification sent successfully',
//       successCount: response.successCount,
//       failureCount: response.failureCount,
//     });
//   } catch (error) {
//     console.error('Bulk notification error:', error);
//     res.status(500).json({
//       message: 'Failed to send notification',
//     });
//   }
// };
