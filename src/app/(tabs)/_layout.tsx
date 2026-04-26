import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="plan">
        <NativeTabs.Trigger.Label>计划</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet.clipboard" md="directions_run" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="track">
        <NativeTabs.Trigger.Icon sf="checkmark.seal" md="settings" />
        <NativeTabs.Trigger.Label>打卡</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_today" />
        <NativeTabs.Trigger.Label>历史</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
