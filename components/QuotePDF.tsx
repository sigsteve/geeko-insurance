import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { RepairItem } from '@/types/quote'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  claimNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f4f4f4',
  },
  tableCell: {
    width: '25%',
    padding: 5,
    fontSize: 10,
  },
  costCell: {
    width: '25%',
    textAlign: 'right',
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#eee',
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  preamble: {
    marginBottom: 20,
    padding: '0 20px'
  },
  preambleText: {
    fontSize: 11,
    marginBottom: 10,
    lineHeight: 1.4,
    color: '#333'
  },
  footer: {
    marginTop: 30,
    padding: '0 20px',
    borderTop: '1px solid #ccc',
    paddingTop: 20
  },
  footerText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic'
  }
})

interface QuotePDFProps {
  repairItems: RepairItem[]
  totalCost: number
  vehicle?: {
    make: string
    model: string
    year: number
  }
  claimNumber: string
}

export const QuotePDF = ({ repairItems, totalCost, vehicle, claimNumber }: QuotePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Geeko Insurance Repair Quote</Text>
        <Text style={styles.claimNumber}>Claim #{claimNumber}</Text>
        {vehicle && (
          <Text style={styles.claimNumber}>
            Vehicle: {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
        )}
      </View>

      <View style={styles.preamble}>
        <Text style={styles.preambleText}>
          Thank you for choosing Geeko Insurance for your vehicle repair needs. We understand that 
          dealing with vehicle damage can be stressful, and we're here to make the process as 
          smooth as possible.
        </Text>
        <Text style={styles.preambleText}>
          At Geeko Insurance, we take pride in providing exceptional service, competitive rates, 
          and a hassle-free claims experience. Our network of certified repair shops and skilled 
          technicians ensures that your vehicle will be restored to its pre-damage condition with 
          the highest quality workmanship.
        </Text>
        <Text style={styles.preambleText}>
          Below you'll find a detailed breakdown of your repair estimate. If you have any questions 
          or concerns, please don't hesitate to reach out to your dedicated claims representative.
        </Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCell}>Damaged Part</Text>
          <Text style={styles.tableCell}>Damage Description</Text>
          <Text style={styles.tableCell}>Repair Method</Text>
          <Text style={[styles.tableCell, styles.costCell]}>Cost</Text>
        </View>

        {repairItems.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.part}</Text>
            <Text style={styles.tableCell}>{item.damage}</Text>
            <Text style={styles.tableCell}>{item.repair}</Text>
            <Text style={[styles.tableCell, styles.costCell]}>
              ${item.cost.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.total}>
        <Text style={styles.totalText}>Total Estimated Cost:</Text>
        <Text style={styles.totalText}>${totalCost.toFixed(2)}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Thank you for trusting Geeko Insurance with your repair needs. We're committed to 
          getting you back on the road safely and quickly.
        </Text>
      </View>
    </Page>
  </Document>
) 