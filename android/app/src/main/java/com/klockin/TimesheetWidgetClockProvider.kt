package com.github.f462.klockin

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews

class TimesheetWidgetClockProvider : AppWidgetProvider() {
  override fun onDisabled(context: Context) {
    TimesheetWidgetData.scheduleRefresh(context, false)
    super.onDisabled(context)
  }

  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    val state = TimesheetWidgetData.load(context)
    render(context, manager, ids, state)
    TimesheetWidgetData.scheduleRefresh(context, state.active && ids.isNotEmpty())
  }

  companion object {
    fun render(
      context: Context,
      manager: AppWidgetManager,
      ids: IntArray,
      state: TimesheetWidgetData.State,
    ) {
      ids.forEach { widgetId ->
        val views = RemoteViews(context.packageName, R.layout.timesheet_widget_clock)
        views.setInt(R.id.clock_root, "setBackgroundColor", state.backgroundColor)
        views.setTextViewText(R.id.clock_duration, TimesheetWidgetData.formatDuration(state.displayedSeconds))

        val openAppPendingIntent = PendingIntent.getActivity(
          context,
          4,
          TimesheetWidgetData.openAppIntent(context),
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        views.setOnClickPendingIntent(R.id.clock_duration, openAppPendingIntent)
        manager.updateAppWidget(widgetId, views)
      }
    }
  }
}
