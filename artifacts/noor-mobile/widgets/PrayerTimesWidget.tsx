import React from "react";
import { FlexWidget, TextWidget, ImageWidget } from "react-native-android-widget";

export interface PrayerWidgetData {
  prayers: Array<{ name: string; time: string; isNext: boolean }>;
  date: string;
  hijri: string;
}

const PRIMARY = "#C19A6B";
const PRIMARY_ALPHA = "#C19A6B25" as `#${string}`;
const BG = "#1A160E";
const BG_CARD = "#242018";
const TEXT = "#FDFBF0";
const MUTED = "#A08060";

export function PrayerTimesWidget({ data }: { data: PrayerWidgetData | null }) {
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
        }}
      >
        <TextWidget
          text="نور"
          style={{ fontSize: 20, fontWeight: "bold", color: PRIMARY }}
        />
        <TextWidget
          text="مواقيت الصلاة"
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
        padding: 12,
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <TextWidget
          text={data.hijri}
          style={{ fontSize: 10, color: MUTED }}
        />
        <TextWidget
          text="مواقيت الصلاة"
          style={{ fontSize: 13, fontWeight: "bold", color: PRIMARY }}
        />
      </FlexWidget>

      {/* Prayer rows */}
      {data.prayers.map((prayer, i) => (
        <FlexWidget
          key={prayer.name}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: prayer.isNext ? PRIMARY_ALPHA : i % 2 === 0 ? BG_CARD : BG,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginBottom: 2,
            borderLeftWidth: prayer.isNext ? 3 : 0,
            borderLeftColor: PRIMARY,
          }}
        >
          <TextWidget
            text={prayer.time}
            style={{
              fontSize: 12,
              fontWeight: prayer.isNext ? "bold" : "normal",
              color: prayer.isNext ? PRIMARY : TEXT,
            }}
          />
          <TextWidget
            text={prayer.name}
            style={{
              fontSize: 13,
              fontWeight: prayer.isNext ? "bold" : "normal",
              color: prayer.isNext ? PRIMARY : TEXT,
            }}
          />
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
