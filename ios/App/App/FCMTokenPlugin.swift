import Foundation
import Capacitor
import FirebaseMessaging

/**
 * Exposes the iOS Firebase Messaging registration token (FCM token) to the Capacitor JS runtime.
 *
 * Why:
 * - @capacitor/push-notifications returns an APNs token on iOS.
 * - Your backend uses FCM v1 API, which requires an FCM registration token.
 */
@objc(FCMTokenPlugin)
public class FCMTokenPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FCMTokenPlugin"
    public let jsName = "FCMToken"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getToken", returnType: CAPPluginReturnPromise),
    ]

    private var tokenObserver: NSObjectProtocol?

    public override func load() {
        print("[FCMTokenPlugin] 🔧 Loading FCMTokenPlugin...")
        
        // Set up listener for FCM token notifications from AppDelegate
        tokenObserver = NotificationCenter.default.addObserver(
            forName: Notification.Name("FCMToken"),
            object: nil,
            queue: OperationQueue.main
        ) { [weak self] notification in
            guard
                let self,
                let token = notification.userInfo?["token"] as? String,
                !token.isEmpty
            else {
                print("[FCMTokenPlugin] ⚠️ Received FCM token notification but token is empty or invalid")
                return
            }

            print("[FCMTokenPlugin] ✅ Received FCM token via NotificationCenter: \(token.prefix(20))...")
            self.notifyListeners("fcmToken", data: ["token": token], retainUntilConsumed: true)
        }

        // Also try to emit the current token on plugin load (in case token was already generated)
        print("[FCMTokenPlugin] 🔍 Checking for existing FCM token...")
        Messaging.messaging().token { [weak self] token, error in
            if let error = error {
                print("[FCMTokenPlugin] ❌ Error getting FCM token on load: \(error.localizedDescription)")
            } else if let token = token, !token.isEmpty {
                print("[FCMTokenPlugin] ✅ Found existing FCM token on load: \(token.prefix(20))...")
                guard let self = self else { return }
                self.notifyListeners("fcmToken", data: ["token": token], retainUntilConsumed: true)
            } else {
                print("[FCMTokenPlugin] ⏳ No FCM token available yet (will be received when Firebase generates it)")
            }
        }
    }

    deinit {
        if let tokenObserver {
            NotificationCenter.default.removeObserver(tokenObserver)
        }
    }

    @objc func getToken(_ call: CAPPluginCall) {
        print("[FCMTokenPlugin] 📞 getToken() called from JavaScript")
        Messaging.messaging().token { token, error in
            if let error = error {
                print("[FCMTokenPlugin] ❌ Error in getToken(): \(error.localizedDescription)")
                call.reject("Failed to get FCM token: \(error.localizedDescription)")
                return
            }
            
            if let token = token, !token.isEmpty {
                print("[FCMTokenPlugin] ✅ getToken() returning token: \(token.prefix(20))...")
                call.resolve(["token": token])
            } else {
                print("[FCMTokenPlugin] ⚠️ getToken() returned empty token")
                call.reject("FCM token is not available yet. Make sure APNs token is registered first.")
            }
        }
    }
}

