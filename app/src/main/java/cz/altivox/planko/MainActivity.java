package cz.altivox.planko;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.webkit.ConsoleMessage;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private static final String TAG = "PLANKO";
    private static final int CHROME = 0xff1d372c;
    private static final String START_URL = "file:///android_asset/index.html?renderer=canvas";
    private WebView webView;
    private FrameLayout root;
    private boolean closing;
    private int rendererRestarts;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // The native theme opts out of forced edge-to-edge on Android 15.
        // Let Android reserve the status/navigation bars instead of padding a WebView.
        root = new FrameLayout(this);
        root.setBackgroundColor(CHROME);
        root.setFitsSystemWindows(true);
        setContentView(root);
        try {
            if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(true);
            getWindow().setStatusBarColor(CHROME);
            getWindow().setNavigationBarColor(CHROME);
            startGame(false);
        } catch (RuntimeException error) {
            Log.e(TAG, "ACTIVITY_START_FAILED", error);
            showNativeError();
        }
    }

    private void startGame(boolean softwareLayer) {
        if (closing || isFinishing()) return;
        try {
            disposeView();
            root.removeAllViews();
            WebView view = new WebView(this);
            webView = view;
            view.setBackgroundColor(CHROME);
            if (softwareLayer) view.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
            WebSettings settings = view.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(false);
            settings.setAllowFileAccessFromFileURLs(false);
            settings.setAllowUniversalAccessFromFileURLs(false);
            view.setWebChromeClient(new WebChromeClient() {
                @Override public boolean onConsoleMessage(ConsoleMessage message) {
                    if (message.messageLevel() == ConsoleMessage.MessageLevel.ERROR || message.messageLevel() == ConsoleMessage.MessageLevel.WARNING) {
                        Log.w(TAG, "WEB: " + message.message());
                    }
                    return true;
                }
            });
            view.setWebViewClient(new WebViewClient() {
                @Override public void onPageFinished(WebView finished, String url) {
                    checkGameReady(finished, 0);
                }

                @Override public void onReceivedError(WebView failed, WebResourceRequest request, WebResourceError error) {
                    if (request.isForMainFrame() && failed == webView) {
                        Log.e(TAG, "PAGE_LOAD_FAILED: " + error.getDescription());
                        root.post(() -> { if (failed == webView) showNativeError(); });
                    }
                }

                @Override public boolean onRenderProcessGone(WebView failed, RenderProcessGoneDetail detail) {
                    Log.e(TAG, "WEBVIEW_RENDERER_GONE crash=" + detail.didCrash());
                    if (failed == webView) {
                        webView = null;
                        root.removeView(failed);
                        failed.destroy();
                        if (!closing && rendererRestarts++ < 2) root.post(() -> startGame(true));
                        else if (!closing) root.post(MainActivity.this::showNativeError);
                    } else {
                        failed.destroy();
                    }
                    // Returning true prevents WebView's renderer failure from crashing the Activity.
                    return true;
                }
            });
            root.addView(view, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
            view.loadUrl(START_URL);
            Log.i(TAG, "GAME_LOADING softwareLayer=" + softwareLayer);
        } catch (RuntimeException error) {
            Log.e(TAG, "WEBVIEW_START_FAILED", error);
            showNativeError();
        }
    }

    private void checkGameReady(WebView source, int attempt) {
        if (closing || source != webView) return;
        if (attempt >= 50) {
            Log.e(TAG, "GAME_READY_TIMEOUT");
            showNativeError();
            return;
        }
        source.postDelayed(() -> {
            if (closing || source != webView) return;
            try {
                source.evaluateJavascript("document.documentElement.dataset.ready==='true' ? document.documentElement.dataset.graphics : ''", result -> {
                    if (closing || source != webView) return;
                    if ("\"canvas\"".equals(result) || "\"webgl\"".equals(result)) {
                        Log.i(TAG, "GAME_READY " + result.replace("\"", ""));
                    } else {
                        checkGameReady(source, attempt + 1);
                    }
                });
            } catch (RuntimeException error) {
                Log.e(TAG, "GAME_CHECK_FAILED", error);
                showNativeError();
            }
        }, 440);
    }

    private void disposeView() {
        WebView old = webView;
        webView = null;
        if (old != null) {
            if (root != null) root.removeView(old);
            old.destroy();
        }
    }

    private void showNativeError() {
        if (closing || root == null) return;
        try { disposeView(); } catch (RuntimeException ignored) { }
        root.removeAllViews();
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER);
        int pad = (int)(24 * getResources().getDisplayMetrics().density);
        panel.setPadding(pad, pad, pad, pad);
        TextView title = new TextView(this);
        title.setText("PLANKO se nepodařilo spustit");
        title.setTextSize(21);
        title.setTextColor(0xfff5f1e8);
        title.setGravity(Gravity.CENTER);
        panel.addView(title);
        TextView text = new TextView(this);
        text.setText("Zkus bezpečný start. Pokud se problém opakuje, aktualizuj Android System WebView.");
        text.setTextSize(14);
        text.setTextColor(0xffd1e0d0);
        text.setGravity(Gravity.CENTER);
        text.setPadding(0, pad / 2, 0, pad);
        panel.addView(text);
        Button retry = new Button(this);
        retry.setText("Zkusit znovu");
        retry.setOnClickListener(v -> { rendererRestarts = 0; startGame(true); });
        panel.addView(retry);
        root.addView(panel, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
    }

    @Override protected void onPause() { if (webView != null) webView.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (webView != null) webView.onResume(); }
    @Override protected void onDestroy() { closing = true; disposeView(); super.onDestroy(); }
}
