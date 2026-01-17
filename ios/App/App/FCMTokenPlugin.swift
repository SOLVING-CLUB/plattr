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
                return
            }

            self.notifyListeners("fcmToken", data: ["token": token], retainUntilConsumed: true)
        }

        // Also try to emit the current token on plugin load.
        Messaging.messaging().token { [weak self] token, _ in
            guard let self, let token, !token.isEmpty else { return }
            self.notifyListeners("fcmToken", data: ["token": token], retainUntilConsumed: true)
        }
    }

    deinit {
        if let tokenObserver {
            NotificationCenter.default.removeObserver(tokenObserver)
        }
    }

    @objc func getToken(_ call: CAPPluginCall) {
        Messaging.messaging().token { token, error in
            if let error {
                call.reject("Failed to get FCM token: \(error.localizedDescription)")
                return
            }
            call.resolve(["token": token ?? ""])
        }
    }
}

