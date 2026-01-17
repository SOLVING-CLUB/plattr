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
        // Configure Firebase early (needed for FCM token generation on iOS)
        FirebaseApp.configure()
        Messaging.messaging().delegate = self
        
        // Foreground presentation (otherwise iOS suppresses banners while app is open)
        UNUserNotificationCenter.current().delegate = self
        
        return true
    }
    
    // MARK: - APNs registration (required to let Firebase map APNs -> FCM token)
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Forward to Capacitor PushNotifications plugin (required)
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)

        Messaging.messaging().apnsToken = deviceToken
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        // Forward to Capacitor PushNotifications plugin (required)
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)

        print("[Plattr] Failed to register for remote notifications: \(error.localizedDescription)")
    }
    
    // MARK: - MessagingDelegate (FCM token)
    
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        let token = fcmToken ?? ""
        print("[Plattr] FCM token: \(token)")
        NotificationCenter.default.post(
            name: Notification.Name("FCMToken"),
            object: nil,
            userInfo: ["token": token]
        )
    }
    
    // MARK: - UNUserNotificationCenterDelegate (foreground presentation)

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show push notifications while app is in foreground (otherwise iOS suppresses them)
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
        
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
