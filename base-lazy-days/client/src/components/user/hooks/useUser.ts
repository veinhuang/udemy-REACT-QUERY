import { AxiosResponse } from 'axios';
import { useQuery, useQueryClient } from 'react-query';

import type { User } from '../../../../../shared/types';
import { axiosInstance, getJWTHeader } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from '../../../user-storage';

async function getUser(
  user: User | null,
  signal: AbortSignal,
): Promise<User | null> {
  if (!user) return null;
  const { data }: AxiosResponse<{ user: User }> = await axiosInstance.get(
    `/user/${user.id}`,
    {
      headers: getJWTHeader(user),
      signal,
    },
  );
  return data.user;
}

interface UseUser {
  user: User | null;
  updateUser: (user: User) => void;
  clearUser: () => void;
}

export function useUser(): UseUser {
  const queryClient = useQueryClient();
  // Pass the current user to getUser for info
  // But on the initial load what if user hasn't logged in yet. It will be null and the query won't run.
  const { data: user } = useQuery<User>(
    queryKeys.user,
    ({ signal }) => getUser(user, signal),
    {
      // initialData is added to the cache unlike placeholderData property or the default destructured value like the fallback = [] in useTreatments
      initialData: getStoredUser,
      // runs either after the query function (second param of useQuery) or
      // from running queryClient.setQueryData
      onSuccess: (received: User | null) => {
        if (!received) {
          clearStoredUser();
        } else {
          // we got a user either from query function or from setQueriesData
          setStoredUser(received);
        }
      },
    },
  );

  // meant to be called from useAuth
  function updateUser(newUser: User): void {
    queryClient.setQueryData(queryKeys.user, newUser);
  }

  // meant to be called from useAuth
  function clearUser() {
    // after running setQueryData the onSuccess from above will run
    queryClient.setQueryData(queryKeys.user, null);

    // Want to make sure user appointments data is cleared on sign out
    // We couldn't just run removeQueries for user data because removeQueries doesn't run the onSuccess property of useQuery to clear local storage.
    // Don't need to provide the entire query key (missing user.id) since this is enough.
    queryClient.removeQueries([queryKeys.appointments, queryKeys.user]);
  }

  return { user, updateUser, clearUser };
}
