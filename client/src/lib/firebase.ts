import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, RecaptchaVerifier, signInWithPhoneNumber, User as FirebaseUser, ConfirmationResult } from 'firebase/auth';

// Firebase configuration
// These should be set in your environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Validate Firebase config
console.log('🔥 Firebase Config Check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  apiKeyLength: firebaseConfig.apiKey?.length || 0
});

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration is incomplete!');
  console.warn('Please set the following environment variables:');
  console.warn('VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID');
} else {
  console.log('✅ Firebase configuration looks good');
}

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  try {
    console.log('🚀 Initializing Firebase app...');
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    throw error;
  }
} else {
  app = getApps()[0];
  console.log('✅ Using existing Firebase app');
}

// Initialize Auth
console.log('🔐 Initializing Firebase Auth...');
export const auth: Auth = getAuth(app);
console.log('✅ Firebase Auth initialized');

// Initialize reCAPTCHA verifier
let recaptchaVerifier: RecaptchaVerifier | null = null;

// Store confirmation result temporarily for OTP verification across screens
let storedConfirmationResult: ConfirmationResult | null = null;

export function storeConfirmationResult(confirmation: ConfirmationResult): void {
  storedConfirmationResult = confirmation;
}

export function getStoredConfirmationResult(): ConfirmationResult | null {
  return storedConfirmationResult;
}

export function clearStoredConfirmationResult(): void {
  storedConfirmationResult = null;
}

function resetRecaptchaContainer(containerId: string) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
}

export async function initializeRecaptcha(containerId: string = 'recaptcha-container'): Promise<RecaptchaVerifier> {
  // Clear previous reCAPTCHA if exists
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
      console.log('🧹 Cleared previous reCAPTCHA');
    } catch (error) {
      console.warn('⚠️ Error clearing previous reCAPTCHA:', error);
    }
    recaptchaVerifier = null;
  }
  
  // Ensure container is clean before rendering
  resetRecaptchaContainer(containerId);

  // Get the container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`❌ reCAPTCHA container "${containerId}" not found in DOM`);
    throw new Error(`reCAPTCHA container with id "${containerId}" not found. Make sure the container exists in the DOM.`);
  }
  
  console.log('📦 Creating new reCAPTCHA verifier...');
  
  // Create new reCAPTCHA verifier with explicit configuration
  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
        console.log('✅ reCAPTCHA verified successfully');
      },
      'expired-callback': () => {
        // reCAPTCHA expired
        console.warn('⚠️ reCAPTCHA expired');
        recaptchaVerifier = null;
      },
      // Add explicit error callback
      'error-callback': (error: any) => {
        console.error('❌ reCAPTCHA error:', error);
        recaptchaVerifier = null;
      }
    });
    console.log('✅ reCAPTCHA verifier created');
  } catch (error) {
    console.error('❌ Error creating reCAPTCHA verifier:', error);
    throw new Error(`Failed to create reCAPTCHA: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Render the reCAPTCHA - this is required even for invisible reCAPTCHA
  try {
    console.log('🎨 Rendering reCAPTCHA...');
    const widgetId = await recaptchaVerifier.render();
    console.log('✅ reCAPTCHA rendered with widget ID:', widgetId);
    return recaptchaVerifier;
  } catch (error) {
    console.error('❌ Error rendering reCAPTCHA:', error);
    recaptchaVerifier = null;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to render reCAPTCHA: ${errorMsg}. Make sure your domain is authorized in Firebase Console.`);
  }
}

export function clearRecaptcha(): void {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  resetRecaptchaContainer('recaptcha-container');
}

/**
 * Send OTP to phone number using Firebase
 */
export async function sendFirebaseOTP(phoneNumber: string, recaptcha: RecaptchaVerifier): Promise<ConfirmationResult> {
  // Format phone number with country code (assuming India +91)
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  
  // Validate phone number format
  if (!/^\+91[6-9]\d{9}$/.test(formattedPhone)) {
    throw new Error('Invalid phone number. Please enter a valid 10-digit Indian mobile number.');
  }
  
  try {
    console.log('📤 Calling signInWithPhoneNumber for:', formattedPhone);
    console.log('🔐 reCAPTCHA verifier:', recaptcha ? 'Present' : 'Missing');
    
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptcha);
    
    console.log('✅ OTP sent successfully! Confirmation result received.');
    console.log('📱 Check your phone for the SMS with verification code.');
    
    return confirmationResult;
  } catch (error: any) {
    console.error('❌ Firebase OTP send error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send OTP. Please try again.';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-phone-number':
          errorMessage = 'Invalid phone number format. Please enter a valid 10-digit Indian mobile number.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please wait a few minutes and try again.';
          break;
        case 'auth/quota-exceeded':
          errorMessage = 'SMS quota exceeded. Please try again later or contact support.';
          break;
        case 'auth/billing-not-enabled':
          errorMessage = 'Firebase Phone Authentication requires billing to be enabled. Please enable billing in Firebase Console or use a test phone number for development.';
          break;
        case 'auth/invalid-app-credential':
          errorMessage = 'Invalid Firebase app credentials. Please check your Firebase configuration and ensure Phone Authentication is properly set up in Firebase Console.';
          break;
        case 'auth/captcha-check-failed':
          errorMessage = 'reCAPTCHA verification failed. Please refresh the page and try again.';
          break;
        case 'auth/missing-phone-number':
          errorMessage = 'Phone number is required. Please enter your phone number.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'This domain is not authorized. Please contact support.';
          break;
        default:
          errorMessage = error.message || `Failed to send OTP (${error.code}). Please try again.`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Verify OTP code
 */
export async function verifyFirebaseOTP(confirmationResult: ConfirmationResult, code: string): Promise<FirebaseUser> {
  try {
    console.log('Confirming OTP code...');
    const result = await confirmationResult.confirm(code);
    console.log('OTP confirmed, user:', result.user.uid);
    return result.user;
  } catch (error: any) {
    console.error('Firebase OTP verify error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Invalid OTP code';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage = 'Invalid verification code. Please check and try again.';
          break;
        case 'auth/code-expired':
          errorMessage = 'Verification code has expired. Please request a new one.';
          break;
        case 'auth/session-expired':
          errorMessage = 'Session expired. Please request a new OTP.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Get Firebase ID token
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    return null;
  }
}

/**
 * Sign out from Firebase
 */
export async function signOutFirebase(): Promise<void> {
  await auth.signOut();
  clearRecaptcha();
}

