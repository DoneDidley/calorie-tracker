import React from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useSessionStorage } from "hooks/useSessionStorage";
import { useAuth } from "hooks/useAuth";
import { v4 as uuidv4 } from "uuid";

import {
  getDiaryEntryByDate,
  addFoodToEntryList,
  updateDiaryEntry,
  removeFoodsByIds,
} from "api/diary";

function useDiaryEntry(date) {
  const { isGuestUser } = useAuth();
  // Local state used for react sortable as does not work with react-query state
  const [eatenList, setEatenList] = React.useState([]);
  const [toEatList, setToEatList] = React.useState([]);

  // replicates return value of react-query useQuery
  const useSessionQuery = () => {
    const [sessionEntry, setSessionEntry] = useSessionStorage(`entry-${date}`, {
      eaten: [],
      toEat: [],
      note: "",
    });

    React.useEffect(() => {
      if (isGuestUser) {
        setEatenList(sessionEntry.eaten);
        setToEatList(sessionEntry.toEat);
      }
    }, [sessionEntry.eaten, sessionEntry.toEat]);

    return {
      data: sessionEntry,
      isLoading: false,
      isSuccess: true,
    };
  };
  const sessionQuery = useSessionQuery();

  const serverQuery = useQuery(
    ["entry", date],
    () => getDiaryEntryByDate(date),
    {
      enabled: !isGuestUser,
      onSuccess: (response) => {
        setEatenList(response.eaten);
        setToEatList(response.toEat);
      },
    }
  );

  console.log({ sessionQuery, serverQuery });

  let query;
  if (isGuestUser) query = sessionQuery;
  else query = serverQuery;

  return [query, { eatenList, setEatenList, toEatList, setToEatList }];
}

function useAddFood(date) {
  const { isGuestUser } = useAuth();

  const useSessionMutation = (date) => {
    const [sessionEntry, setSessionEntry] = useSessionStorage(`entry-${date}`, {
      eaten: [],
      toEat: [],
      note: "",
    });
    const [isSuccess, setIsSuccess] = React.useState(false);

    const mutate = ({ listName, items }) => {
      const itemsWithIds = { ...items, _id: uuidv4() };

      sessionEntry[listName] = [...sessionEntry[listName], itemsWithIds];

      setSessionEntry({ ...sessionEntry });
      setIsSuccess(true);
    };
    return { mutate, isSuccess };
  };
  const sessionMutator = useSessionMutation(date);

  const queryClient = useQueryClient();
  const serverMutator = useMutation(addFoodToEntryList, {
    enabled: !isGuestUser,
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries(["entry", variables.date]);
    },
  });

  let mutator;
  if (isGuestUser) mutator = sessionMutator;
  else mutator = serverMutator;

  return mutator;
}

function useUpdateEntry(date) {
  const { isGuestUser } = useAuth();

  const queryClient = useQueryClient();
  const serverMutator = useMutation(updateDiaryEntry, {
    onMutate: async (newData) => {
      await queryClient.cancelQueries(["entry", newData.date]);

      const rollback = queryClient.getQueryData(["entry", newData.date]);

      const { eaten, toEat, note } = newData.updates;

      let updates;
      if (note !== undefined) updates = { note };
      else updates = { eaten, toEat };

      queryClient.setQueryData(["entry", newData.date], (prev) => ({
        ...prev,
        ...updates,
      }));

      return rollback;
    },
    onError: (_err, newData, rollback) => {
      queryClient.setQueryData(["entry", newData.date], rollback);
    },
    onSettled: (newData, _err) => {
      queryClient.invalidateQueries(["entry", newData.date]);
    },
  });

  const useSessionMutation = () => {
    const [sessionEntry, setSessionEntry] = useSessionStorage(`entry-${date}`, {
      eaten: [],
      toEat: [],
      note: "",
    });

    const mutate = ({ updates }) => {
      sessionEntry.note = updates.note;

      setSessionEntry({ ...sessionEntry });
    };
    return { mutate };
  };
  const sessionMutator = useSessionMutation();

  let mutator;
  if (isGuestUser) mutator = sessionMutator;
  else mutator = serverMutator;

  return mutator;
}

function useRemoveFoods(date) {
  const { isGuestUser } = useAuth();
  const queryClient = useQueryClient();

  const useSessionMutation = () => {
    const [sessionEntry, setSessionEntry] = useSessionStorage(`entry-${date}`, {
      eaten: [],
      toEat: [],
      note: "",
    });

    const mutate = ({ date, selectedIds }) => {
      const eatenFiltered = sessionEntry.eaten.filter(
        (item) => !selectedIds.includes(item._id)
      );
      const toEatFiltered = sessionEntry.toEat.filter(
        (item) => !selectedIds.includes(item._id)
      );

      const newEntry = {
        eaten: eatenFiltered,
        toEat: toEatFiltered,
        note: sessionEntry.note,
      };

      setSessionEntry(newEntry);
    };
    return { mutate };
  };
  const sessionMutator = useSessionMutation();

  const serverMutator = useMutation(removeFoodsByIds, {
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries(["entry", variables.date]);
    },
  });

  let mutator;
  if (isGuestUser) mutator = sessionMutator;
  else mutator = serverMutator;

  return mutator;
}
export { useDiaryEntry, useAddFood, useUpdateEntry, useRemoveFoods };
