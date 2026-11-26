package com.github.f462.klockin

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import java.util.Calendar

class ActiveTimesheetNotificationService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var isReceiverRegistered = false

  private val updateRunnable = object : Runnable {
    override fun run() {
      if (!refreshNotification()) {
        return
      }
      handler.postDelayed(this, UPDATE_INTERVAL_MS)
    }
  }

  private val tickReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      refreshNotification()
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val state = readState(this)
    if (!state.active && !state.paused) {
      stopUpdates()
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
      return START_NOT_STICKY
    }

    ensureChannel(this, state.channelName)
    val notification = buildNotification(this, state)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }

    if (state.active) {
      registerTickReceiver()
      handler.removeCallbacks(updateRunnable)
      handler.postDelayed(updateRunnable, UPDATE_INTERVAL_MS)
    } else {
      stopUpdates()
    }
    return START_STICKY
  }

  override fun onDestroy() {
    stopUpdates()
    super.onDestroy()
  }

  private fun refreshNotification(): Boolean {
    val state = readState(this)
    if (!state.active && !state.paused) {
      stopUpdates()
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
      return false
    }

    ensureChannel(this, state.channelName)
    NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, buildNotification(this, state))
    return true
  }

  private fun registerTickReceiver() {
    if (isReceiverRegistered) {
      return
    }
    val filter = IntentFilter().apply {
      addAction(Intent.ACTION_TIME_TICK)
      addAction(Intent.ACTION_SCREEN_ON)
    }
    ContextCompat.registerReceiver(this, tickReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
    isReceiverRegistered = true
  }

  private fun stopUpdates() {
    handler.removeCallbacks(updateRunnable)
    if (isReceiverRegistered) {
      runCatching { unregisterReceiver(tickReceiver) }
      isReceiverRegistered = false
    }
  }

  private data class NotificationState(
    val active: Boolean,
    val paused: Boolean,
    val activeBeginAt: Long,
    val workedSeconds: Int,
    val workdaySeconds: Int,
    val snapshotAt: Long,
    val channelName: String,
    val title: String,
    val pausedTitle: String,
    val bodyTemplate: String,
    val pauseLabel: String,
    val resumeLabel: String,
    val stopLabel: String,
  )

  companion object {
    const val PREFERENCES_NAME = "active_timesheet_notification"
    private const val CHANNEL_ID = "active-timesheet"
    private const val NOTIFICATION_ID = 7301
    private const val REQUEST_CODE_PAUSE = 7302
    private const val REQUEST_CODE_RESUME = 7303
    private const val REQUEST_CODE_STOP = 7304
    private const val UPDATE_INTERVAL_MS = 15_000L
    private const val DEFAULT_CHANNEL_NAME = "Active timesheet"
    private const val DEFAULT_TITLE = "Timesheet running"
    private const val DEFAULT_PAUSED_TITLE = "Timesheet paused"
    private const val DEFAULT_BODY_TEMPLATE = "Current: __CURRENT__ • Total today: __TOTAL__"
    private const val DEFAULT_PAUSE_LABEL = "Pause"
    private const val DEFAULT_RESUME_LABEL = "Resume"
    private const val DEFAULT_STOP_LABEL = "Stop"

    fun sync(context: Context) {
      val state = readState(context)
      if (!state.active && !state.paused) {
        context.stopService(Intent(context, ActiveTimesheetNotificationService::class.java))
        NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
        return
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
        ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
        PackageManager.PERMISSION_GRANTED
      ) {
        return
      }

      val intent = Intent(context, ActiveTimesheetNotificationService::class.java)
      ContextCompat.startForegroundService(context, intent)
    }

    private fun readState(context: Context): NotificationState {
      val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      return NotificationState(
        active = preferences.getBoolean("active", false),
        paused = preferences.getBoolean("paused", false),
        activeBeginAt = preferences.getLong("activeBeginAt", 0L),
        workedSeconds = preferences.getInt("workedSeconds", 0).coerceAtLeast(0),
        workdaySeconds = preferences.getInt("workdaySeconds", 0).coerceAtLeast(0),
        snapshotAt = preferences.getLong("snapshotAt", 0L),
        channelName = preferences.getString("channelName", DEFAULT_CHANNEL_NAME) ?: DEFAULT_CHANNEL_NAME,
        title = preferences.getString("title", DEFAULT_TITLE) ?: DEFAULT_TITLE,
        pausedTitle = preferences.getString("pausedTitle", DEFAULT_PAUSED_TITLE) ?: DEFAULT_PAUSED_TITLE,
        bodyTemplate = preferences.getString("bodyTemplate", DEFAULT_BODY_TEMPLATE) ?: DEFAULT_BODY_TEMPLATE,
        pauseLabel = preferences.getString("pauseLabel", DEFAULT_PAUSE_LABEL) ?: DEFAULT_PAUSE_LABEL,
        resumeLabel = preferences.getString("resumeLabel", DEFAULT_RESUME_LABEL) ?: DEFAULT_RESUME_LABEL,
        stopLabel = preferences.getString("stopLabel", DEFAULT_STOP_LABEL) ?: DEFAULT_STOP_LABEL,
      )
    }

    private fun ensureChannel(context: Context, channelName: String) {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        return
      }
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      val channel = NotificationChannel(
        CHANNEL_ID,
        channelName,
        NotificationManager.IMPORTANCE_LOW,
      )
      manager.createNotificationChannel(channel)
    }

    private fun buildNotification(context: Context, state: NotificationState): android.app.Notification {
      val now = System.currentTimeMillis()
      val currentSeconds = if (state.active && state.activeBeginAt > 0L) {
        ((now - state.activeBeginAt) / 1000L).coerceAtLeast(0L)
      } else {
        0L
      }

      val totalSeconds = if (isToday(state.snapshotAt, now)) {
        val elapsedSinceSnapshot = if (state.active) {
          ((now - state.snapshotAt) / 1000L).coerceAtLeast(0L)
        } else {
          0L
        }
        state.workedSeconds.toLong() + elapsedSinceSnapshot
      } else if (state.active && state.activeBeginAt > 0L) {
        val startOfToday = Calendar.getInstance().apply {
          timeInMillis = now
          set(Calendar.HOUR_OF_DAY, 0)
          set(Calendar.MINUTE, 0)
          set(Calendar.SECOND, 0)
          set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        ((now - maxOf(state.activeBeginAt, startOfToday)) / 1000L).coerceAtLeast(0L)
      } else {
        0L
      }

      val body = state.bodyTemplate
        .replace("__CURRENT__", formatDuration(currentSeconds))
        .replace("__TOTAL__", formatDuration(totalSeconds))

      val openAppIntent = Intent(context, MainActivity::class.java).apply {
        action = Intent.ACTION_VIEW
        data = Uri.parse("klockin://active-timesheet")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }
      val openAppPendingIntent = PendingIntent.getActivity(
        context,
        NOTIFICATION_ID,
        openAppIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

      val builder = NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_notification)
        .setContentTitle(if (state.active) state.title else state.pausedTitle)
        .setContentText(body)
        .setOngoing(true)
        .setAutoCancel(false)
        .setOnlyAlertOnce(true)
        .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
        .setContentIntent(openAppPendingIntent)

      if (state.active) {
        builder.addAction(
          0,
          state.pauseLabel,
          createActionPendingIntent(
            context,
            ActiveTimesheetNotificationReceiver.ACTION_PAUSE,
            REQUEST_CODE_PAUSE,
          ),
        )
      } else {
        builder.addAction(
          0,
          state.resumeLabel,
          createActionPendingIntent(
            context,
            ActiveTimesheetNotificationReceiver.ACTION_RESUME,
            REQUEST_CODE_RESUME,
          ),
        )
      }

      builder.addAction(
        0,
        state.stopLabel,
        createActionPendingIntent(
          context,
          ActiveTimesheetNotificationReceiver.ACTION_STOP,
          REQUEST_CODE_STOP,
        ),
      )

      if (state.workdaySeconds > 0) {
        val progress = totalSeconds.coerceIn(0L, state.workdaySeconds.toLong()).toInt()
        builder.setProgress(state.workdaySeconds, progress, false)
      }

      return builder.build()
    }

    private fun createActionPendingIntent(
      context: Context,
      action: String,
      requestCode: Int,
    ): PendingIntent {
      val intent = Intent(context, ActiveTimesheetNotificationReceiver::class.java).apply {
        this.action = action
      }
      return PendingIntent.getBroadcast(
        context,
        requestCode,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }

    private fun formatDuration(seconds: Long): String {
      val totalMinutes = seconds.coerceAtLeast(0L) / 60L
      return "%02d:%02d".format(totalMinutes / 60L, totalMinutes % 60L)
    }

    private fun isToday(timestamp: Long, now: Long): Boolean {
      if (timestamp <= 0L) return false
      val timestampDate = Calendar.getInstance().apply { timeInMillis = timestamp }
      val currentDate = Calendar.getInstance().apply { timeInMillis = now }
      return timestampDate.get(Calendar.YEAR) == currentDate.get(Calendar.YEAR) &&
        timestampDate.get(Calendar.DAY_OF_YEAR) == currentDate.get(Calendar.DAY_OF_YEAR)
    }
  }
}
