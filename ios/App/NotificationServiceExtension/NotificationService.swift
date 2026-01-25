import UserNotifications
import UIKit

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        guard let bestAttemptContent = bestAttemptContent else {
            return
        }
        
        let userInfo = bestAttemptContent.userInfo
        
        // 1. Handle Rich Media (Images)
        // If the payload contains 'image_url', download it and attach it
        if let data = userInfo["data"] as? [String: Any],
           let imageUrlString = data["image_url"] as? String,
           let imageUrl = URL(string: imageUrlString) {
            
            downloadImage(from: imageUrl) { attachment in
                if let attachment = attachment {
                    bestAttemptContent.attachments = [attachment]
                }
                contentHandler(bestAttemptContent)
            }
            return
        }
        
        // Also check top-level for image (sometimes handled that way)
        if let imageUrlString = userInfo["image"] as? String,
           let imageUrl = URL(string: imageUrlString) {
             downloadImage(from: imageUrl) { attachment in
                if let attachment = attachment {
                    bestAttemptContent.attachments = [attachment]
                }
                contentHandler(bestAttemptContent)
            }
            return
        }

        // 2. Modify Title/Body if needed (e.g. decrypt)
        // bestAttemptContent.title = "\(bestAttemptContent.title) [Modified]"
        
        contentHandler(bestAttemptContent)
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content,
        // otherwise the original push payload will be used.
        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
    
    // Helper to download image
    private func downloadImage(from url: URL, completion: @escaping (UNNotificationAttachment?) -> Void) {
        let task = URLSession.shared.downloadTask(with: url) { (downloadedUrl, response, error) in
            guard let downloadedUrl = downloadedUrl else {
                completion(nil)
                return
            }
            
            // Move to a permanent location so it persists
            let path = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0]
            let uniqueURL = URL(fileURLWithPath: path).appendingPathComponent("notification_image_\(UUID().uuidString).jpg")
            
            try? FileManager.default.moveItem(at: downloadedUrl, to: uniqueURL)
            
            do {
                let attachment = try UNNotificationAttachment(identifier: "picture", url: uniqueURL, options: nil)
                completion(attachment)
            } catch {
                print("Error creating attachment: \(error)")
                completion(nil)
            }
        }
        task.resume()
    }
}
