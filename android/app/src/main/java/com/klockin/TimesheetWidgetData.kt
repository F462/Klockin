package com.github.f462.klockin

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import java.util.Calendar

object TimesheetWidgetData {
  const val PREFERENCES_NAME = "timesheet_widget"
  private const val ACTION_REFRESH = "com.github.f462.klockin.REFRESH_WIDGET"

  data class State(
    val active: Boolean,
    val displayedSeconds: Int,
    val backgroundColor: Int,
  )

  fun load(context: Context): State {
    val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
    val workedSeconds = preferences.getInt("workedSeconds", 0).coerceAtLeast(0)
    val active = preferences.getBoolean("active", false)
    val activeBeginAt = preferences.getLong("activeBeginAt", 0)
    val snapshotAt = preferences.getLong("snapshotAt", 0)
    val primaryContainer = preferences.getString("primaryContainer", "#D1FAE5") ?: "#D1FAE5"
    val parsedColor = runCatching { Color.parseColor(primaryContainer) }
      .getOrDefault(Color.rgb(209, 250, 229))
    val backgroundColor = Color.argb(
      204,
      Color.red(parsedColor),
      Color.green(parsedColor),
      Color.blue(parsedColor),
    )
    val now = System.currentTimeMillis()
    val snapshotIsToday = isToday(snapshotAt, now)
    val activeStartedToday = isToday(activeBeginAt, now)
    val displayedSeconds = if (snapshotIsToday) {
      workedSeconds + if (active && activeStartedToday) {
        ((now - snapshotAt) / 1000L).toInt().coerceAtLeast(0)
      } else {
        0
      }
    } else {
      0
    }
    return State(active, displayedSeconds, backgroundColor)
  }

  fun formatDuration(seconds: Int): String =
    "%02d:%02d".format(seconds / 3600, (seconds % 3600) / 60)

  fun isRefreshIntent(intent: Intent): Boolean = intent.action == ACTION_REFRESH

  fun refreshAll(context: Context, scheduleRefresh: Boolean) {
    val state = load(context)
    val manager = AppWidgetManager.getInstance(context)
    val mainIds = manager.getAppWidgetIds(ComponentName(context, TimesheetWidgetProvider::class.java))
    val clockIds = manager.getAppWidgetIds(ComponentName(context, TimesheetWidgetClockProvider::class.java))
    TimesheetWidgetProvider.render(context, manager, mainIds, state)
    TimesheetWidgetClockProvider.render(context, manager, clockIds, state)
    if (scheduleRefresh) {
      scheduleRefresh(context, state.active && (mainIds.isNotEmpty() || clockIds.isNotEmpty()))
    }
  }

  fun openAppIntent(context: Context): Intent =
    Intent(context, MainActivity::class.java).apply {
      action = Intent.ACTION_VIEW
      data = Uri.parse("klockin://active-timesheet")
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }

  private fun isToday(timestamp: Long, now: Long): Boolean {
    if (timestamp <= 0) return false
    val timestampDate = Calendar.getInstance().apply { timeInMillis = timestamp }
    val currentDate = Calendar.getInstance().apply { timeInMillis = now }
    return timestampDate.get(Calendar.YEAR) == currentDate.get(Calendar.YEAR) &&
      timestampDate.get(Calendar.DAY_OF_YEAR) == currentDate.get(Calendar.DAY_OF_YEAR)
  }

  fun scheduleRefresh(context: Context, enabled: Boolean) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val intent = Intent(context, TimesheetWidgetProvider::class.java).setAction(ACTION_REFRESH)
    val pendingIntent = PendingIntent.getBroadcast(
      context,
      2,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    if (enabled) {
      alarmManager.setInexactRepeating(
        AlarmManager.RTC,
        System.currentTimeMillis() + 60_000L,
        60_000L,
        pendingIntent,
      )
    } else {
      alarmManager.cancel(pendingIntent)
    }
  }
}
