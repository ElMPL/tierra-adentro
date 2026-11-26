package io.github.elmpl.tierraadentro;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** Una pantalla con el juego (o la plataforma) y la búsqueda de versiones nuevas de la app. */
public class MainActivity extends Activity {
    private WebView web;
    private FrameLayout root;
    private LinearLayout cover;
    private TextView msg;
    private ProgressBar spin;
    private Button retry;
    private View fsView;
    private WebChromeClient.CustomViewCallback fsCb;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private boolean failed, shown;
    private int tries;
    private long lastBack;
    private String pendUrl;
    private int pendVer;
    private AlertDialog progDlg;
    private ProgressBar progBar;
    private TextView progTxt;

    private final Runnable slow = () -> { if (!shown && !failed) msg.setText(Config.SLOW); };

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(Config.BG);
        getWindow().setNavigationBarColor(Config.BG);
        root = new FrameLayout(this);
        root.setBackgroundColor(Config.BG);
        web = new WebView(this);
        web.setBackgroundColor(Config.BG);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        buildCover();
        setContentView(root);
        setupWeb();
        load();
        ui.postDelayed(() -> checkUpdate(false), 2500);
    }

    // ---------- Pantalla de carga / error ----------

    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    private void buildCover() {
        cover = new LinearLayout(this);
        cover.setOrientation(LinearLayout.VERTICAL);
        cover.setGravity(Gravity.CENTER);
        cover.setBackgroundColor(Config.BG);
        cover.setPadding(dp(32), dp(32), dp(32), dp(32));
        cover.setClickable(true);
        TextView t = new TextView(this);
        t.setText(Config.NAME);
        t.setTextColor(Config.ACCENT);
        t.setTextSize(30);
        t.setTypeface(Typeface.create(Typeface.SERIF, Typeface.BOLD));
        t.setGravity(Gravity.CENTER);
        spin = new ProgressBar(this);
        spin.setIndeterminateTintList(ColorStateList.valueOf(Config.ACCENT));
        msg = new TextView(this);
        msg.setTextColor(0xFFEDE6F2);
        msg.setTextSize(16);
        msg.setGravity(Gravity.CENTER);
        msg.setLineSpacing(0, 1.15f);
        retry = new Button(this);
        retry.setText("Reintentar");
        retry.setAllCaps(false);
        retry.setTextSize(17);
        retry.setTextColor(Config.BG);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Config.ACCENT);
        bg.setCornerRadius(dp(12));
        retry.setBackground(bg);
        retry.setPadding(dp(28), dp(10), dp(28), dp(10));
        retry.setVisibility(View.GONE);
        retry.setOnClickListener(v -> load());
        cover.addView(t, wrap(0));
        cover.addView(spin, wrap(dp(28)));
        cover.addView(msg, wrap(dp(20)));
        cover.addView(retry, wrap(dp(24)));
        root.addView(cover, new FrameLayout.LayoutParams(-1, -1));
    }

    private LinearLayout.LayoutParams wrap(int top) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-2, -2);
        p.topMargin = top;
        p.gravity = Gravity.CENTER_HORIZONTAL;
        return p;
    }

    private void load() {
        failed = false;
        shown = false;
        cover.animate().cancel();
        cover.setAlpha(1f);
        cover.setVisibility(View.VISIBLE);
        spin.setVisibility(View.VISIBLE);
        retry.setVisibility(View.GONE);
        msg.setText("");
        ui.removeCallbacks(slow);
        ui.postDelayed(slow, 4000);
        web.loadUrl(Config.START);
    }

    private void showWeb() {
        if (shown) return;
        shown = true;
        tries = 0;
        ui.removeCallbacks(slow);
        cover.animate().alpha(0f).setDuration(250).withEndAction(() -> cover.setVisibility(View.GONE));
    }

    private void showError(String text, boolean server) {
        failed = true;
        shown = false;
        ui.removeCallbacks(slow);
        cover.animate().cancel();
        cover.setAlpha(1f);
        cover.setVisibility(View.VISIBLE);
        // El servidor gratuito tarda en despertar: reintentar solo unas veces
        if (server && Config.AUTO_RETRY && tries < 8) {
            tries++;
            spin.setVisibility(View.VISIBLE);
            retry.setVisibility(View.GONE);
            msg.setText(Config.SLOW);
            ui.postDelayed(this::load, 6000);
            return;
        }
        spin.setVisibility(View.GONE);
        retry.setVisibility(View.VISIBLE);
        msg.setText(text);
    }

    // ---------- WebView ----------

    private void setupWeb() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setAllowFileAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportMultipleWindows(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setUserAgentString(s.getUserAgentString() + " " + Config.UA + "/" + version());
        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(web, true);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                return route(r.getUrl());
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                if (!failed) showWeb();
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) showError(Config.OFFLINE, Config.AUTO_RETRY);
            }

            @Override
            public void onReceivedHttpError(WebView v, WebResourceRequest r, WebResourceResponse res) {
                if (!r.isForMainFrame()) return;
                int code = res.getStatusCode();
                if (code >= 500) showError("El servidor no respondió (" + code + "). Probá de nuevo en un rato.", true);
                else if (code >= 400) showError("No se encontró la página (" + code + "). Probá de nuevo más tarde.", false);
            }

            @Override
            public boolean onRenderProcessGone(WebView v, RenderProcessGoneDetail d) {
                ui.post(MainActivity.this::recreate);
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View v, CustomViewCallback cb) {
                if (fsView != null) { cb.onCustomViewHidden(); return; }
                fsView = v;
                fsCb = cb;
                root.addView(v, new FrameLayout.LayoutParams(-1, -1));
                immersive(true);
            }

            @Override
            public void onHideCustomView() { hideCustom(); }

            @Override
            public boolean onCreateWindow(WebView v, boolean dialog, boolean user, Message m) {
                // Enlaces que abren otra ventana: los de afuera van al navegador
                final boolean[] done = {false};
                WebView t = new WebView(MainActivity.this);
                t.setWebViewClient(new WebViewClient() {
                    private void go(WebView w, Uri u) {
                        if (done[0]) return;
                        done[0] = true;
                        if (!route(u)) web.loadUrl(u.toString());
                        ui.post(w::destroy);
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView w, WebResourceRequest r) { go(w, r.getUrl()); return true; }

                    @Override
                    public void onPageStarted(WebView w, String url, Bitmap f) { w.stopLoading(); go(w, Uri.parse(url)); }
                });
                ((WebView.WebViewTransport) m.obj).setWebView(t);
                m.sendToTarget();
                return true;
            }
        });
    }

    /** true = lo abre otra app (navegador); false = se queda adentro. */
    private boolean route(Uri u) {
        String sc = u.getScheme() == null ? "" : u.getScheme();
        if (sc.equals("http") || sc.equals("https")) {
            String path = u.getPath() == null ? "/" : u.getPath();
            if (sc.equals("https") && Config.HOST.equalsIgnoreCase(u.getHost()) && path.startsWith(Config.PATH)) return false;
            outside(u);
            return true;
        }
        if (sc.equals("about") || sc.equals("data") || sc.equals("blob") || sc.equals("javascript")) return false;
        outside(u);
        return true;
    }

    private void outside(Uri u) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (Exception e) {
            Toast.makeText(this, "No hay una app para abrir ese enlace", Toast.LENGTH_SHORT).show();
        }
    }

    private void hideCustom() {
        if (fsView == null) return;
        root.removeView(fsView);
        fsView = null;
        if (fsCb != null) fsCb.onCustomViewHidden();
        fsCb = null;
        immersive(Config.IMMERSIVE);
    }

    private void immersive(boolean on) {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c == null) return;
            if (on) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            } else {
                c.show(WindowInsets.Type.systemBars());
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(on
                    ? View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    : 0);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if (focus) immersive(Config.IMMERSIVE || fsView != null);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (fsView != null) { hideCustom(); return; }
        if (!shown) { exitOrWarn(); return; }
        if (Config.GAME_BACK) {
            web.evaluateJavascript("window.__appBack?window.__appBack():'none'", r -> {
                if (r == null || r.contains("exit") || r.contains("none")) exitOrWarn();
            });
            return;
        }
        if (web.canGoBack()) { web.goBack(); return; }
        exitOrWarn();
    }

    private void exitOrWarn() {
        long now = System.currentTimeMillis();
        if (now - lastBack < 2000) { finish(); return; }
        lastBack = now;
        Toast.makeText(this, "Tocá atrás de nuevo para salir", Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause();
        if (Config.PAUSE_IN_BACKGROUND) web.pauseTimers();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        web.resumeTimers();
        if (pendUrl != null && Build.VERSION.SDK_INT >= 26 && getPackageManager().canRequestPackageInstalls()) {
            String u = pendUrl;
            pendUrl = null;
            download(pendVer, u);
        } else {
            checkUpdate(false);
        }
    }

    @Override
    protected void onDestroy() {
        ui.removeCallbacksAndMessages(null);
        if (progDlg != null) progDlg.dismiss();
        root.removeAllViews();
        web.destroy();
        super.onDestroy();
    }

    // ---------- Versiones nuevas de la app (GitHub Releases) ----------

    @SuppressWarnings("deprecation")
    private int version() {
        try {
            PackageInfo p = getPackageManager().getPackageInfo(getPackageName(), 0);
            return Build.VERSION.SDK_INT >= 28 ? (int) p.getLongVersionCode() : p.versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    private static String readAll(InputStream in) throws IOException {
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        byte[] b = new byte[8192];
        int n;
        while ((n = in.read(b)) > 0) o.write(b, 0, n);
        in.close();
        return o.toString("UTF-8");
    }

    /** Busca la última versión publicada: primero con el enlace público "latest" de GitHub y, si falla, con su API. */
    private void checkUpdate(boolean force) {
        final SharedPreferences sp = getSharedPreferences("app", MODE_PRIVATE);
        final long now = System.currentTimeMillis();
        if (!force && now - sp.getLong("chk", 0) < 30 * 60 * 1000L) return;
        final int mine = version();
        new Thread(() -> {
            String[] found = null;
            try { found = latestByLink(); } catch (Exception e) { Log.i(Config.UA, "enlace latest: " + e); }
            if (found == null) try { found = latestByApi(); } catch (Exception e) { Log.i(Config.UA, "API: " + e); }
            if (found == null) { Log.i(Config.UA, "No se pudo saber la última versión"); return; }
            sp.edit().putLong("chk", now).apply();
            final int v = Integer.parseInt(found[0]);
            final String url = found[1];
            Log.i(Config.UA, "Versión instalada " + mine + ", publicada " + v);
            if (v <= mine) return;
            if (sp.getInt("skipV", 0) == v && now - sp.getLong("skipT", 0) < 12 * 3600 * 1000L) return;
            ui.post(() -> ask(v, url));
        }).start();
    }

    /** github.com/…/releases/latest redirige a …/releases/tag/vN: de ahí sale el número y el enlace del APK. */
    private String[] latestByLink() throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL("https://github.com/" + Config.REPO + "/releases/latest").openConnection();
        c.setInstanceFollowRedirects(false);
        c.setRequestMethod("HEAD");
        c.setConnectTimeout(10000);
        c.setReadTimeout(10000);
        c.setRequestProperty("User-Agent", Config.UA);
        int code = c.getResponseCode();
        String loc = c.getHeaderField("Location");
        c.disconnect();
        if (code / 100 != 3 || loc == null || !loc.contains("/releases/tag/")) return null;
        String tag = loc.substring(loc.lastIndexOf('/') + 1);
        String digits = tag.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return null;
        return new String[]{digits, "https://github.com/" + Config.REPO + "/releases/download/" + tag + "/" + Config.APK};
    }

    private String[] latestByApi() throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL("https://api.github.com/repos/" + Config.REPO + "/releases/latest").openConnection();
        c.setConnectTimeout(10000);
        c.setReadTimeout(10000);
        c.setRequestProperty("Accept", "application/vnd.github+json");
        c.setRequestProperty("User-Agent", Config.UA);
        if (c.getResponseCode() != 200) { Log.i(Config.UA, "API respondió " + c.getResponseCode()); return null; }
        JSONObject j = new JSONObject(readAll(c.getInputStream()));
        String digits = j.optString("tag_name", "").replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return null;
        JSONArray a = j.optJSONArray("assets");
        if (a != null) for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.getJSONObject(i);
            if (o.optString("name").endsWith(".apk")) return new String[]{digits, o.optString("browser_download_url")};
        }
        return null;
    }

    private AlertDialog.Builder dialog() {
        return new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert);
    }

    private void ask(int v, String url) {
        if (isFinishing() || progDlg != null) return;
        dialog().setTitle("Hay una versión nueva")
                .setMessage("Se puede instalar la versión " + v + " de la app. Tus partidas y datos se mantienen.")
                .setPositiveButton("Actualizar", (d, w) -> startUpdate(v, url))
                .setNegativeButton("Después", (d, w) -> getSharedPreferences("app", MODE_PRIVATE).edit()
                        .putInt("skipV", v).putLong("skipT", System.currentTimeMillis()).apply())
                .show();
    }

    private void startUpdate(int v, String url) {
        if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
            pendVer = v;
            pendUrl = url;
            Toast.makeText(this, "Activá «Permitir de esta fuente» y volvé a la app", Toast.LENGTH_LONG).show();
            try {
                startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
            } catch (Exception e) {
                pendUrl = null;
                outside(Uri.parse(url));
            }
            return;
        }
        download(v, url);
    }

    private void closeProg() {
        if (progDlg != null) progDlg.dismiss();
        progDlg = null;
    }

    private void download(final int v, final String url) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(24), dp(12), dp(24), dp(4));
        progBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progBar.setMax(100);
        progBar.setProgressTintList(ColorStateList.valueOf(Config.ACCENT));
        progTxt = new TextView(this);
        progTxt.setText("Conectando…");
        progTxt.setGravity(Gravity.END);
        box.addView(progBar, new LinearLayout.LayoutParams(-1, -2));
        box.addView(progTxt, new LinearLayout.LayoutParams(-1, -2));
        progDlg = dialog().setTitle("Bajando la versión " + v).setView(box).setCancelable(false).show();
        new Thread(() -> {
            PackageInstaller.Session s = null;
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setInstanceFollowRedirects(true);
                c.setConnectTimeout(15000);
                c.setReadTimeout(30000);
                c.setRequestProperty("User-Agent", Config.UA);
                int code = c.getResponseCode();
                if (code != 200) throw new IOException("HTTP " + code);
                long len = c.getContentLengthLong();
                PackageInstaller pi = getPackageManager().getPackageInstaller();
                PackageInstaller.SessionParams p = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                p.setAppPackageName(getPackageName());
                if (len > 0) p.setSize(len);
                int id = pi.createSession(p);
                s = pi.openSession(id);
                try (InputStream in = c.getInputStream(); OutputStream out = s.openWrite("app.apk", 0, len > 0 ? len : -1)) {
                    byte[] b = new byte[65536];
                    long got = 0;
                    int n, last = -1;
                    while ((n = in.read(b)) > 0) {
                        out.write(b, 0, n);
                        got += n;
                        if (len > 0) {
                            final int pc = (int) (got * 100 / len);
                            if (pc != last) {
                                last = pc;
                                ui.post(() -> { if (progBar != null) { progBar.setProgress(pc); progTxt.setText(pc + " %"); } });
                            }
                        }
                    }
                    s.fsync(out);
                }
                Intent i = new Intent(this, InstallReceiver.class).setAction(getPackageName() + ".INSTALL");
                int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
                s.commit(PendingIntent.getBroadcast(this, id, i, fl).getIntentSender());
                s.close();
                ui.post(this::closeProg);
            } catch (Exception e) {
                if (s != null) try { s.abandon(); } catch (Exception ignored) { }
                ui.post(() -> {
                    closeProg();
                    Toast.makeText(this, "No se pudo bajar la actualización. Te abro la página para bajarla a mano.", Toast.LENGTH_LONG).show();
                    outside(Uri.parse(url));
                });
            }
        }).start();
    }
}
