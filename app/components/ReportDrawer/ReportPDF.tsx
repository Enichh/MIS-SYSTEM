import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import type { ReportData } from "@/lib/types/reports";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: "2 solid #000",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
  },
  meta: {
    fontSize: 10,
    color: "#666",
    marginBottom: 5,
  },
  section: {
    marginBottom: 25,
    pageBreakInside: "avoid",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    fontSize: 11,
    marginBottom: 8,
    color: "#444",
    whiteSpace: "pre-wrap",
  },
  metricsContainer: {
    marginBottom: 30,
    flexDirection: "column",
  },
  metric: {
    marginBottom: 12,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderLeft: "4 solid #000",
  },
  metricLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  metricUnit: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  metricTrend: {
    fontSize: 14,
    marginLeft: 8,
  },
  trendUp: {
    color: "#22c55e",
  },
  trendDown: {
    color: "#ef4444",
  },
  trendStable: {
    color: "#666",
  },
});

interface ReportDocumentProps {
  data: ReportData;
}

function ReportDocument({ data }: ReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.meta}>
            Report Type: {data.type.replace(/_/g, " ").toUpperCase()}
          </Text>
          <Text style={styles.meta}>
            Generated: {new Date(data.generatedAt).toLocaleString()}
          </Text>
        </View>

        {data.metrics.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.metricsContainer}>
              {data.metrics.map((metric, index) => (
                <View key={index} style={styles.metric}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                    {metric.unit && (
                      <Text style={styles.metricUnit}> {metric.unit}</Text>
                    )}
                    {metric.trend && (
                      <Text
                        style={[
                          styles.metricTrend,
                          metric.trend === "up"
                            ? styles.trendUp
                            : metric.trend === "down"
                              ? styles.trendDown
                              : styles.trendStable,
                        ]}
                      >
                        {metric.trend === "up"
                          ? " ↑"
                          : metric.trend === "down"
                            ? " ↓"
                            : " →"}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {data.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

interface ReportPDFProps {
  data: ReportData | null;
}

export function ReportPDF({ data }: ReportPDFProps) {
  if (!data) return null;

  const filename = "Report.pdf";

  return (
    <PDFDownloadLink
      document={<ReportDocument data={data} />}
      fileName={filename}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="report-pdf-download-btn"
          aria-label="Download PDF report"
        >
          {loading ? "Generating PDF..." : "Download PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
