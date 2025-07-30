import { MdRestaurant, MdFitnessCenter, MdDirectionsRun, MdSportsBasketball, MdAttachMoney, MdEventNote } from 'react-icons/md';
import { CALENDAR_SOURCES } from './calendarUtils';

// Map each source to a color and icon
export const eventStyleMap = {
  [CALENDAR_SOURCES.MEAL]: {
    colorClass: 'bg-orange-500 text-white',
    Icon: MdRestaurant,
  },
  [CALENDAR_SOURCES.PLANNED_MEAL]: {
    colorClass: 'bg-orange-400 text-white',
    Icon: MdRestaurant,
  },
  [CALENDAR_SOURCES.WORKOUT]: {
    colorClass: 'bg-red-500 text-white',
    Icon: MdFitnessCenter,
  },
  [CALENDAR_SOURCES.CARDIO]: {
    colorClass: 'bg-green-500 text-white',
    Icon: MdDirectionsRun,
  },
  [CALENDAR_SOURCES.SPORT]: {
    colorClass: 'bg-green-500 text-white',
    Icon: MdSportsBasketball,
  },
  [CALENDAR_SOURCES.EXPENSE]: {
    colorClass: 'bg-purple-500 text-white',
    Icon: MdAttachMoney,
  },
  [CALENDAR_SOURCES.NOTE]: {
    colorClass: 'bg-blue-500 text-white',
    Icon: MdEventNote,
  },
  default: {
    colorClass: 'bg-card text-base',
    Icon: MdEventNote,
  },
};

export function getEventStyle(source) {
  return eventStyleMap[source] || eventStyleMap.default;
} 