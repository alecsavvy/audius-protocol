import type { ReactNode } from 'react'
import React from 'react'

import { removeNullable } from '@audius/common'
import { View } from 'react-native'

import { Text } from 'app/components/core'
import { flexRowCentered, makeStyles } from 'app/styles'
import type { ThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  container: {
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    borderRadius: spacing(1)
  },
  row: {
    ...flexRowCentered(),
    justifyContent: 'space-between',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6),
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  lastRow: {
    borderBottomWidth: 0
  },
  grayRow: {
    backgroundColor: palette.neutralLight10
  }
}))

export type SummaryTableItem = {
  id: string
  label: ReactNode
  value: ReactNode
}

export type SummaryTableProps = {
  items: SummaryTableItem[]
  summaryItem?: SummaryTableItem
  title: ReactNode
  secondaryTitle?: ReactNode
  summaryLabelColor?: keyof ThemeColors
  summaryValueColor?: keyof ThemeColors
}

export const SummaryTable = ({
  items,
  summaryItem,
  title,
  secondaryTitle,
  summaryLabelColor,
  summaryValueColor = 'secondary'
}: SummaryTableProps) => {
  const styles = useStyles()
  const nonNullItems = items.filter(removeNullable)
  return (
    <View style={styles.container}>
      <View style={[styles.row, styles.grayRow]}>
        <Text weight='bold'>{title}</Text>
        <Text variant='body' fontSize='large' weight='bold'>
          {secondaryTitle}
        </Text>
      </View>
      {nonNullItems.map(({ id, label, value }, index) => (
        <View
          key={id}
          style={[
            styles.row,
            summaryItem === undefined && index === nonNullItems.length - 1
              ? styles.lastRow
              : null
          ]}
        >
          <Text>{label}</Text>
          <Text>{value}</Text>
        </View>
      ))}
      {summaryItem !== undefined ? (
        <View style={[styles.row, styles.lastRow, styles.grayRow]}>
          <Text
            variant='body'
            fontSize='medium'
            weight='bold'
            color={summaryLabelColor}
          >
            {summaryItem.label}
          </Text>
          <Text
            variant='body'
            fontSize='medium'
            weight='bold'
            color={summaryValueColor}
          >
            {summaryItem.value}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
