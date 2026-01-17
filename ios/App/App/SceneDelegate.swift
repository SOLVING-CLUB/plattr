import UIKit
import Capacitor

/**
 * UIScene lifecycle support.
 *
 * iOS increasingly expects apps to adopt scenes. Without this, Xcode/iOS logs warnings and
 * future OS versions may assert. We also forward deep-link entry points to Capacitor.
 */
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    private func toUIApplicationOpenURLOptions(_ options: UIScene.OpenURLOptions) -> [UIApplication.OpenURLOptionsKey: Any] {
        var result: [UIApplication.OpenURLOptionsKey: Any] = [:]

        // Map what iOS exposes on UIScene.OpenURLOptions
        if let sourceApp = options.sourceApplication {
            result[.sourceApplication] = sourceApp
        }
        result[.annotation] = options.annotation
        if #available(iOS 14.0, *) {
            result[.openInPlace] = options.openInPlace
        }
        return result
    }

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // Using Main.storyboard as configured in Info.plist (UISceneStoryboardFile),
        // so no manual window setup is needed here.

        // Forward any launch URL (custom scheme) to Capacitor.
        if let urlContext = connectionOptions.urlContexts.first {
            _ = ApplicationDelegateProxy.shared.application(
                UIApplication.shared,
                open: urlContext.url,
                options: toUIApplicationOpenURLOptions(urlContext.options)
            )
        }

        // Forward universal links to Capacitor.
        if let userActivity = connectionOptions.userActivities.first(where: { $0.activityType == NSUserActivityTypeBrowsingWeb }) {
            _ = ApplicationDelegateProxy.shared.application(
                UIApplication.shared,
                continue: userActivity,
                restorationHandler: { _ in }
            )
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let ctx = URLContexts.first else { return }
        _ = ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            open: ctx.url,
            options: toUIApplicationOpenURLOptions(ctx.options)
        )
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            continue: userActivity,
            restorationHandler: { _ in }
        )
    }
}

