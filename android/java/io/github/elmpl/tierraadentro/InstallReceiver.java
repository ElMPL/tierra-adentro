package io.github.elmpl.tierraadentro;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.widget.Toast;

/** Recibe el resultado de la instalación de una versión nueva y muestra la confirmación de Android. */
public class InstallReceiver extends BroadcastReceiver {
    @Override
    @SuppressWarnings("deprecation")
    public void onReceive(Context ctx, Intent it) {
        int st = it.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        if (st == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirm = it.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirm == null) return;
            confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                ctx.startActivity(confirm);
            } catch (Exception e) {
                Toast.makeText(ctx, "Abrí la app de nuevo para terminar la actualización", Toast.LENGTH_LONG).show();
            }
        } else if (st != PackageInstaller.STATUS_SUCCESS && st != PackageInstaller.STATUS_FAILURE_ABORTED) {
            String m = it.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
            Toast.makeText(ctx, "No se pudo instalar la actualización" + (m != null ? ": " + m : ""), Toast.LENGTH_LONG).show();
        }
    }
}
