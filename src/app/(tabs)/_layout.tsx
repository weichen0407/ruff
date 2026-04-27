import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { PlatformColor } from 'react-native';

export default function TabLayout() {
  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={PlatformColor('systemOrange')}
    >
      <NativeTabs.Trigger name="plan">
        <NativeTabs.Trigger.Icon sf="list.bullet" md="list" />
        <NativeTabs.Trigger.Label>计划</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="track">
        <NativeTabs.Trigger.Icon sf="checkmark.circle" md="check_circle" />
        <NativeTabs.Trigger.Label>打卡</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Icon sf="calendar.badge.clock" md="event" />
        <NativeTabs.Trigger.Label>历史</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
