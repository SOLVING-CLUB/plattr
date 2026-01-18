import UIKit
import Capacitor
import Firebase
import FirebaseMessaging
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        print("[Plattr] 🚀 AppDelegate didFinishLaunchingWithOptions")
        
        // Configure Firebase early (needed for FCM token generation on iOS)
        print("[Plattr] 🔥 Configuring Firebase...")
        FirebaseApp.configure()
        
        print("[Plattr] 📱 Setting Messaging delegate...")
        Messaging.messaging().delegate = self
        
        // CRITICAL: Enable auto-initialization for FCM
        // This ensures FCM notifications are automatically displayed
        Messaging.messaging().isAutoInitEnabled = true
        
        // CRITICAL: Tell Firebase to forward notifications to UNUserNotificationCenter
        // This ensures willPresent is called for foreground notifications
        // Without this, Firebase Messaging handles notifications internally and won't call willPresent
        UNUserNotificationCenter.current().delegate = self
        application.registerForRemoteNotifications()
        
        // Foreground presentation (otherwise iOS suppresses banners while app is open)
        print("[Plattr] 🔔 Setting UNUserNotificationCenter delegate...")
        UNUserNotificationCenter.current().delegate = self
        
        // Request notification permissions early
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("[Plattr] ❌ Notification permission error: \(error.localizedDescription)")
            } else {
                print("[Plattr] ✅ Notification permission granted: \(granted)")
            }
        }
        
        print("[Plattr] ✅ AppDelegate initialization complete")
        return true
    }
    
    // MARK: - APNs registration (required to let Firebase map APNs -> FCM token)
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("[Plattr] ✅ APNs device token received: \(tokenString.prefix(20))...")
        print("[Plattr] APNs token full length: \(tokenString.count) characters")
        
        // Forward to Capacitor PushNotifications plugin (required)
        print("[Plattr] 📤 Forwarding APNs token to Capacitor...")
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)

        // Set APNs token in Firebase Messaging (required for FCM token generation)
        print("[Plattr] 🔥 Setting APNs token in Firebase Messaging...")
        Messaging.messaging().apnsToken = deviceToken
        print("[Plattr] ✅ APNs token set in Firebase Messaging")
        
        // Note: apnsToken is a property, not a method, so we can't verify it this way
        // The token is set correctly above
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("[Plattr] ❌ Failed to register for remote notifications: \(error.localizedDescription)")
        
        // Forward to Capacitor PushNotifications plugin (required)
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }
    
    // MARK: - MessagingDelegate (FCM token)
    
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        let token = fcmToken ?? ""
        print("[Plattr] 🔔 FCM token received: \(token.isEmpty ? "EMPTY" : token.prefix(20) + "...")")
        
        if token.isEmpty {
            print("[Plattr] ⚠️ WARNING: FCM token is empty!")
            // Try to get token manually
            Messaging.messaging().token { token, error in
                if let error = error {
                    print("[Plattr] ❌ Error getting FCM token: \(error.localizedDescription)")
                } else if let token = token, !token.isEmpty {
                    print("[Plattr] ✅ FCM token retrieved manually: \(token.prefix(20))...")
                    NotificationCenter.default.post(
                        name: Notification.Name("FCMToken"),
                        object: nil,
                        userInfo: ["token": token]
                    )
                }
            }
        } else {
            print("[Plattr] ✅ Posting FCM token to NotificationCenter")
            NotificationCenter.default.post(
                name: Notification.Name("FCMToken"),
                object: nil,
                userInfo: ["token": token]
            )
        }
    }
    
    // MARK: - Handle FCM messages (for data-only notifications)
    // Note: For notifications with a 'notification' block, iOS will call willPresent automatically
    // This method is for data-only messages
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        print("[Plattr] 📬 didReceiveRemoteNotification called")
        print("[Plattr] UserInfo keys: \(userInfo.keys)")
        
        // Forward to UNUserNotificationCenter if it's a notification with alert
        // This ensures willPresent is called even if Firebase Messaging intercepts it
        if let aps = userInfo["aps"] as? [AnyHashable: Any],
           let alert = aps["alert"] {
            print("[Plattr] 📨 Notification has alert, forwarding to UNUserNotificationCenter...")
            // Create a UNNotificationRequest to trigger willPresent
            let content = UNMutableNotificationContent()
            if let alertDict = alert as? [AnyHashable: Any] {
                content.title = alertDict["title"] as? String ?? ""
                content.body = alertDict["body"] as? String ?? ""
            } else if let alertString = alert as? String {
                content.body = alertString
            }
            content.userInfo = userInfo
            content.sound = UNNotificationSound.default
            if let badge = aps["badge"] as? Int {
                content.badge = NSNumber(value: badge)
            }
            
            let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    print("[Plattr] ❌ Error adding notification: \(error.localizedDescription)")
                } else {
                    print("[Plattr] ✅ Notification forwarded to UNUserNotificationCenter")
                }
            }
        }
        
        // Also forward to Firebase Messaging
        Messaging.messaging().appDidReceiveMessage(userInfo)
        
        completionHandler(.newData)
    }
    
    // MARK: - UNUserNotificationCenterDelegate (foreground presentation)

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        print("[Plattr] 📨 Notification received in foreground")
        print("[Plattr] Notification title: \(notification.request.content.title)")
        print("[Plattr] Notification body: \(notification.request.content.body)")
        print("[Plattr] Notification userInfo: \(notification.request.content.userInfo)")
        print("[Plattr] Notification identifier: \(notification.request.identifier)")
        
        // Show push notifications while app is in foreground (otherwise iOS suppresses them)
        // CRITICAL: This is what makes notifications appear when app is open
        // Use .list and .banner for iOS 15+ to show in notification center AND as banner
        if #available(iOS 15.0, *) {
            completionHandler([.banner, .list, .sound, .badge])
        } else if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
        
        print("[Plattr] ✅ Notification will be displayed (banner, sound, badge)")
        
        // Forward to Capacitor PushNotifications plugin for JavaScript handling
        // This ensures the 'pushNotificationReceived' event fires in JS
        let userInfo = notification.request.content.userInfo
        NotificationCenter.default.post(
            name: Notification.Name("CAPDidReceiveRemoteNotification"),
            object: nil,
            userInfo: userInfo
        )
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        // Forward notification tap to Capacitor PushNotifications plugin
        // This ensures the 'pushNotificationActionPerformed' event fires in JS
        let userInfo = response.notification.request.content.userInfo
        NotificationCenter.default.post(
            name: Notification.Name("CAPDidReceiveNotificationResponse"),
            object: nil,
            userInfo: userInfo
        )
        completionHandler()
    }
    
    // MARK: - Capacitor deep link forwarding

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
