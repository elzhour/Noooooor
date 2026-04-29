import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export interface NextPrayerData {
  prayerName: string;
  prayerTime: string;
  countdown: string;
  date: string;
  hijri: string;
}

const PRIMARY = "#C19A6B";
const PRIMARY_ALPHA = "#C19A6B20" as `#${string}`;
const BG = "#1A160E";
const TEXT = "#FDFBF0";
const MUTED = "#A08060";

export function NextPrayerWidget({ data }: { data: NextPrayerData | null }) {
  if (!data) {
    return (
      <FlexWidget
        style={{
          height: "match_parent",
          width: "match_parent",
          backgroundColor: BG,
          borderRadius: 20,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <TextWidget
          text="نور"
          style={{ fontSize: 22, fontWeight: "bold", color: PRIMARY }}
        />
        <TextWidget
          text="الصلاة القادمة"
          style={{ fontSize: 12, color: MUTED, marginTop: 4 }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: BG,
        borderRadius: 20,
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 14,
      }}
    >
      {/* App name + date row */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TextWidget
          text={data.hijri}
          style={{ fontSize: 9, color: MUTED }}
        />
        <TextWidget
          text="نور"
          style={{ fontSize: 11, fontWeight: "bold", color: PRIMARY }}
        />
      </FlexWidget>

      {/* Prayer name */}
      <FlexWidget
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <TextWidget
          text="الصلاة القادمة"
          style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}
        />
        <TextWidget
          text={data.prayerName}
          style={{ fontSize: 26, fontWeight: "bold", color: PRIMARY }}
        />
        <TextWidget
          text={data.prayerTime}
          style={{ fontSize: 16, color: TEXT, marginTop: 2 }}
        />
      </FlexWidget>

      {/* Countdown */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: PRIMARY_ALPHA,
          borderRadius: 10,
          paddingVertical: 6,
          paddingHorizontal: 12,
        }}
      >
        <TextWidget
          text={`⏱ ${data.countdown}`}
          style={{ fontSize: 13, color: PRIMARY, fontWeight: "bold" }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
