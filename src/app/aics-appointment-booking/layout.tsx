import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DSWD AICS Appointment Booking',
  description: 'Public appointment booking for DSWD Assistance to Individuals in Crisis Situations.'
};

export default function BookingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
