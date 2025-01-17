import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { forwardRef, useCallback, useEffect, useMemo, useRef, type ForwardedRef } from 'react';
import {
    StyleSheet,
    View,
    useWindowDimensions,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';

import { Day, Header, dayStyle, dotStyle, markingStyle } from '../../common';
import { useCalendarHandler, useCalendarState } from '../../hooks';
import type { DateType } from '../../types';
import { dayjs, getMonthWeeksArray } from '../../utilities';

import type { WeekCalendarProps } from './types';

function WeekCalendar(
    {
        date,
        maxDate,
        minDate,
        markedDates,
        containerStyle,
        locale,
        hideHeader,
        onChangePage,
        onPressDay,
        onPressLeft,
        onPressRight,
    }: WeekCalendarProps,
    ref: ForwardedRef<FlashList<DateType[]>>,
) {
    // variables
    const initData = useMemo(() => ({ date, maxDate, minDate }), [date, maxDate, minDate]);

    // refs
    const flashListRef = useRef<FlashList<DateType[]>>(null);

    // hooks
    const { setDate } = useCalendarHandler(initData);
    const calendarState = useCalendarState();
    const initialIndex = calendarState.selectedWeekNumber - 1;
    const weekOfMonthArray = getMonthWeeksArray(calendarState.selectedDateString);

    // effects
    useEffect(() => {
        if (ref !== null) {
            if (typeof ref === 'function') {
                ref(flashListRef.current);
            } else {
                ref.current = flashListRef.current;
            }
        }
    }, [ref]);

    useEffect(() => {
        flashListRef.current?.scrollToIndex({ index: calendarState.selectedWeekNumber - 1, animated: true });
    }, [calendarState.selectedDateString, calendarState.selectedWeekNumber]);

    // styles
    const { width } = useWindowDimensions();
    const weekSize = useMemo<{ width: number; height: number }>(() => ({ width, height: dayStyle.wrapper.height }), [width]);
    const weekWrapper = useMemo<StyleProp<ViewStyle>>(
        () => [containerStyle, weekSize, styles.gestureWrapper],
        [containerStyle, weekSize],
    );
    const itemWrapper = useMemo<StyleProp<ViewStyle>>(() => [weekSize, styles.itemWrapper], [weekSize]);

    // functions
    const handleChangePage = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            onChangePage?.(Math.floor(event.nativeEvent.contentOffset.x / width));
        },
        [onChangePage, width],
    );

    // render functions
    const renderItem: ListRenderItem<DateType[]> = useCallback(
        ({ item }) => {
            return (
                <View style={itemWrapper}>
                    {item.map((dayInfo, index) => {
                        const isSameDay = calendarState.selectedDate.isSame(dayInfo.dayString, 'day');
                        const isSameMonth = calendarState.selectedDate.isSame(dayInfo.dayString, 'month');

                        const currentDayjs = dayjs(dayInfo.dayString);
                        const isDisableMaxDay = calendarState.maxDate ? currentDayjs.isAfter(calendarState.maxDate) : false;
                        const isDisableMinDay = calendarState.minDate ? currentDayjs.isBefore(calendarState.minDate) : false;
                        const isDisableDay = isDisableMaxDay || isDisableMinDay;

                        const textColor = isDisableDay ? '#BDBDBDFF' : isSameMonth ? '#111111' : '#BDBDBDFF';
                        const isDot = markedDates?.[dayInfo.dayString]?.marked;

                        return (
                            <View key={index} style={dayStyle.wrapper}>
                                <Day
                                    key={dayInfo.dayString}
                                    date={dayInfo}
                                    markingStyle={isSameDay ? markingStyle : undefined}
                                    dotStyle={isDot ? dotStyle : undefined}
                                    textColor={textColor}
                                    onPress={
                                        !isDisableDay
                                            ? () => {
                                                  console.log(dayInfo.dayString);
                                                  onPressDay?.(dayInfo.dayString);
                                                  setDate(dayInfo.dayString);
                                              }
                                            : undefined
                                    }
                                />
                            </View>
                        );
                    })}
                </View>
            );
        },
        [
            calendarState.maxDate,
            calendarState.minDate,
            calendarState.selectedDate,
            itemWrapper,
            markedDates,
            onPressDay,
            setDate,
        ],
    );

    return (
        <GestureHandlerRootView style={weekWrapper}>
            {!hideHeader && <Header locale={locale} onPressLeft={onPressLeft} onPressRight={onPressRight} />}
            <FlashList
                ref={flashListRef}
                data={weekOfMonthArray}
                initialScrollIndex={initialIndex}
                renderItem={renderItem}
                estimatedItemSize={weekSize.width}
                showsHorizontalScrollIndicator={false}
                renderScrollComponent={ScrollView}
                keyExtractor={(item, index) => item[0]?.dayString + index.toString()}
                onMomentumScrollEnd={handleChangePage}
                pagingEnabled
                horizontal
            />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    gestureWrapper: {
        backgroundColor: '#FFFFFFFF',
    },
    itemWrapper: {
        flexDirection: 'row',
    },
});

export default forwardRef(WeekCalendar);
