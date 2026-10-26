import React from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { colors } from "../ui";

export type FilterOption = { label: string; value: string };

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePickerField({ label, value, onChange }: { label: string; value: string; onChange(value: string): void }) {
  const [visible, setVisible] = React.useState(false);
  const selectedDate = value ? new Date(`${value}T12:00:00`) : new Date();
  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setVisible(false);
    if (event.type !== "dismissed" && selected) onChange(toIsoDate(selected));
  };
  const displayValue = value
    ? selectedDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "Select date";

  return <View style={styles.dateField}>
    <Text style={styles.dateLabel}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${displayValue}`} onPress={() => setVisible(true)} style={styles.dateButton}>
      <Text numberOfLines={1} style={[styles.dateValue, !value && styles.datePlaceholder]}>{displayValue}</Text>
      <Text style={styles.calendarMark}>▦</Text>
    </Pressable>
    {visible && Platform.OS === "android" ? <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleChange} /> : null}
    {Platform.OS === "ios" ? <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} accessibilityLabel="Close date picker" />
        <View style={styles.iosPicker}>
          <View style={styles.pickerActions}>
            <Pressable onPress={() => setVisible(false)}><Text style={styles.pickerAction}>Cancel</Text></Pressable>
            <Text style={styles.pickerTitle}>{label}</Text>
            <Pressable onPress={() => setVisible(false)}><Text style={styles.pickerAction}>Done</Text></Pressable>
          </View>
          <DateTimePicker value={selectedDate} mode="date" display="spinner" onChange={handleChange} />
        </View>
      </View>
    </Modal> : null}
  </View>;
}

export function FilterPanel({ title, summary, expanded, onToggle, children }: React.PropsWithChildren<{ title: string; summary: string; expanded: boolean; onToggle(): void }>) {
  return <View style={styles.panel}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onToggle} style={styles.panelHeader}>
      <View style={styles.panelCopy}><Text style={styles.panelTitle}>{title}</Text><Text numberOfLines={1} style={styles.panelSummary}>{summary}</Text></View>
      <Text style={styles.panelChevron}>{expanded ? "⌃" : "⌄"}</Text>
    </Pressable>
    {expanded ? <View style={styles.panelContent}>{children}</View> : null}
  </View>;
}

export function FilterChips({ label, value, options, onChange }: { label: string; value: string; options: FilterOption[]; onChange(value: string): void }) {
  return <View style={styles.group}>
    <Text style={styles.label}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const selected = value === option.value;
        return <Pressable key={`${label}-${option.value}`} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onChange(option.value)} style={[styles.chip, selected && styles.active]}>
          <Text style={[styles.chipText, selected && styles.activeText]}>{option.label}</Text>
        </Pressable>;
      })}
    </ScrollView>
  </View>;
}

export function Pagination({ page, totalPages, loading, onPrevious, onNext }: { page: number; totalPages: number; loading?: boolean; onPrevious(): void; onNext(): void }) {
  const pages = Math.max(1, totalPages || 1);
  return <View style={styles.pagination}>
    <Pressable accessibilityRole="button" accessibilityLabel="Previous page" disabled={page <= 1 || loading} onPress={onPrevious} style={[styles.pageButton, (page <= 1 || loading) && styles.disabled]}><Text style={styles.pageButtonText}>‹ Previous</Text></Pressable>
    <Text style={styles.pageText}>Page {page} of {pages}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Next page" disabled={page >= pages || loading} onPress={onNext} style={[styles.pageButton, (page >= pages || loading) && styles.disabled]}><Text style={styles.pageButtonText}>Next ›</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  panel: { borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: "#FAFAFA", overflow: "hidden" },
  panelHeader: { minHeight: 54, paddingHorizontal: 13, paddingVertical: 9, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  panelCopy: { flex: 1, gap: 2 }, panelTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" }, panelSummary: { color: colors.muted, fontSize: 11 }, panelChevron: { color: colors.muted, fontSize: 21, paddingHorizontal: 4 },
  panelContent: { borderTopWidth: 1, borderTopColor: colors.line, padding: 12, gap: 12, backgroundColor: colors.white },
  dateField: { flex: 1, minWidth: 0, gap: 6 }, dateLabel: { color: colors.ink, fontSize: 12, fontWeight: "600" }, dateButton: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 5, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 10 }, dateValue: { flexShrink: 1, color: colors.ink, fontSize: 13, fontWeight: "500" }, datePlaceholder: { color: colors.muted }, calendarMark: { color: colors.muted, fontSize: 17 }, modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }, iosPicker: { backgroundColor: colors.white, paddingBottom: 24, borderTopLeftRadius: 18, borderTopRightRadius: 18 }, pickerActions: { minHeight: 48, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.line }, pickerAction: { color: colors.link, fontSize: 15, fontWeight: "600" }, pickerTitle: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  group: { gap: 7 }, label: { color: colors.muted, fontSize: 12, fontWeight: "700" }, row: { gap: 8, paddingRight: 12 },
  chip: { borderRadius: 20, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white }, active: { backgroundColor: "#EEF2FF", borderColor: "#A5B4FC" }, chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" }, activeText: { color: "#4338CA" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.line, marginTop: 8, paddingTop: 12 }, pageButton: { borderRadius: 10, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white }, pageButtonText: { color: colors.ink, fontSize: 12, fontWeight: "700" }, pageText: { color: colors.muted, fontSize: 12, fontWeight: "600" }, disabled: { opacity: 0.4 },
});
