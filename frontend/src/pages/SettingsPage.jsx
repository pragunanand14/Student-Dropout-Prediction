import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'

const initialSettings = {
  riskThreshold: 70,
  notifications: true,
  weeklyReports: true,
}

const SettingsPage = () => {
  const [settings, setSettings] = useState(initialSettings)
  const [message, setMessage] = useState('')

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }))
    setMessage('')
  }

  const saveSettings = () => {
    setMessage('Settings saved successfully.')
  }

  const resetSettings = () => {
    setSettings(initialSettings)
    setMessage('Settings reset to defaults.')
  }

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Adjust dashboard behavior and notification preferences."
    >
      <div className="w-full">
        <div className="dash-card p-8">
          <h2 className="mb-6 text-xl font-bold text-[var(--dash-text)]">Dashboard Preferences</h2>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--dash-muted)]">High Risk Threshold</label>
              <input
                type="range"
                min="40"
                max="95"
                value={settings.riskThreshold}
                onChange={(e) => updateSetting('riskThreshold', Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-2 text-sm text-[var(--dash-muted)]">Current threshold: {settings.riskThreshold}</p>
            </div>

            <label className="flex items-center justify-between rounded-xl border border-[var(--dash-border)] p-4">
              <span className="font-medium text-[var(--dash-text)]">Email notifications</span>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSetting('notifications', e.target.checked)}
                className="h-5 w-5"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-[var(--dash-border)] p-4">
              <span className="font-medium text-[var(--dash-text)]">Weekly summary reports</span>
              <input
                type="checkbox"
                checked={settings.weeklyReports}
                onChange={(e) => updateSetting('weeklyReports', e.target.checked)}
                className="h-5 w-5"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={saveSettings}
              className="dash-btn dash-btn-primary px-5 py-3 text-sm"
            >
              Save Settings
            </button>
            <button
              onClick={resetSettings}
              className="dash-btn dash-btn-ghost px-5 py-3 text-sm"
            >
              Reset
            </button>
          </div>

          {message ? (
            <div className="mt-6 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-accent-soft)] p-4 text-[var(--dash-success)]">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage
