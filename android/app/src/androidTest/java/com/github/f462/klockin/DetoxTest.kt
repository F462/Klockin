package com.github.f462.klockin

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.rule.ActivityTestRule
import com.wix.detox.Detox
import com.wix.detox.config.DetoxConfig
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Auxiliary Android instrumentation test required by Detox.
 *
 * Detox drives the app through this test APK: it boots [MainActivity]
 * and hands control to the Detox runtime, which then talks to the React Native
 * bridge and the Jest test runner. You do not write your E2E assertions here —
 * they live in the e2e folder (as .test.js files) — this class only wires up Detox.
 */
@RunWith(AndroidJUnit4::class)
@LargeTest
class DetoxTest {
    // Note: `@get:Rule` (not `@Rule`) is required — JUnit discovers rules via
    // the getter, and a plain Kotlin property annotation would only be stored
    // in Kotlin metadata, invisible to Java reflection.
    @get:Rule
    val activityRule = ActivityTestRule(MainActivity::class.java, false, false)

    @Test
    fun runDetoxTests() {
        val detoxConfig = DetoxConfig()
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60
        detoxConfig.rnContextLoadTimeoutSec = if (BuildConfig.DEBUG) 180 else 60

        Detox.runTests(activityRule, detoxConfig)
    }
}
