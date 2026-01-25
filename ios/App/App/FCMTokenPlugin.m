#import <Capacitor/Capacitor.h>

CAP_PLUGIN(FCMTokenPlugin, "FCMToken",
  CAP_PLUGIN_METHOD(getToken, CAPPluginReturnPromise);
)
    