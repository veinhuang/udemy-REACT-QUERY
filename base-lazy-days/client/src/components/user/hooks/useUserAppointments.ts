import dayjs from 'dayjs';
import { useQuery } from 'react-query';

import type { Appointment, User } from '../../../../../shared/types';
import { axiosInstance, getJWTHeader } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import { useUser } from './useUser';

// for when we need a query function for useQuery
// Why are we allowing null for the param if the query shouldn't ran be user is null.
// The param can take null as well for defensive programming in case there are race conditions or other factors we don't want to contact the server
async function getUserAppointments(
  user: User | null,
): Promise<Appointment[] | null> {
  if (!user) return null;
  const { data } = await axiosInstance.get(`/user/${user.id}/appointments`, {
    headers: getJWTHeader(user),
  });
  return data.appointments;
}

export function useUserAppointments(): Appointment[] {
  const { user } = useUser();

  const fallback: Appointment[] = [];
  const { data: UserAppointments = fallback } = useQuery(
    'user-appointments',
    () => getUserAppointments(user),
    { enabled: !!user },
  );

  return UserAppointments;
}
