import React, { useState, useEffect } from "react";
import axios from "axios";
import { Redirect } from "react-router-dom";
import Table from "./Table";
import AmountInput from "./AmountInput";
import LoadingSpinner from "components/shared/LoadingSpinner";
import { Button } from "components/shared/styling";

import { useAlert } from "hooks/useAlert";

export default function SelectedFood({ selectedFood }) {
  const {
    isLiquid,
    servingOptions = [],
    macrosPerServe = {},
    brand,
    name,
    perServeSize = 0,
  } = selectedFood;

  const [diaryRedirect, setDiaryRedirect] = useState(false);
  const [_isLoading, _setIsLoading] = useState(false);
  const [chosenServing, setChosenServing] = useState({});

  const { setTimedAlert } = useAlert();

  useEffect(() => {
    setChosenServing({
      chosenAmount: 1,
      servingChoice: {
        _id: "serve",
        servingName: "1 Serving",
        servingSize: perServeSize,
      },
      index: 0,
    });
  }, [selectedFood, perServeSize]);

  const servingOptionsWithDefaults = [
    {
      _id: "serve",
      servingName: "1 Serving",
      servingSize: perServeSize,
    },
    {
      _id: isLiquid ? "mL" : "g",
      servingName: isLiquid ? "mL" : "g",
      servingSize: 1,
    },
    ...servingOptions,
  ];

  let adjustedMacros = { ...macrosPerServe };
  for (let macro in adjustedMacros) {
    adjustedMacros[macro] =
      (adjustedMacros[macro] / perServeSize) *
      chosenServing.servingChoice.servingSize *
      chosenServing.chosenAmount;
    adjustedMacros[macro] = parseFloat(adjustedMacros[macro].toFixed(1)); // rounds to one decimal
  }

  const onAmountChange = (e) => {
    setChosenServing({
      ...chosenServing,
      chosenAmount: parseInt(e.target.value),
    });
  };

  const onSizeChange = (e) => {
    setChosenServing({
      ...chosenServing,
      servingChoice: servingOptionsWithDefaults[e.target.value],
      index: e.target.value,
    });
  };

  async function handleSubmit() {
    const URLParams = new URLSearchParams(window.location.search);
    const dateParam = URLParams.get("date");
    const listParam = URLParams.get("list");

    try {
      _setIsLoading(true);
      await axios.post(`/api/diary/${dateParam}/add-food?list=${listParam}`, {
        food_id: selectedFood._id,
        chosenOptions: {
          serving: chosenServing.servingChoice,
          chosenAmount: chosenServing.chosenAmount,
          chosenMacros: adjustedMacros,
        },
      });
      _setIsLoading(false);
      setTimedAlert("alert", `${name} added to ${listParam} list`);
      setDiaryRedirect(true);
    } catch (err) {
      setTimedAlert("error", err);
      _setIsLoading(false);
    }
  }

  if (diaryRedirect) return <Redirect to={`/diary`} />;
  if (Object.keys(selectedFood).length === 0) {
    return (
      <div
        className={`border-2 border-gray-600 flex-col bg-white p-3 mb-2 rounded-lg shadow-lg max-w-xs w-full sm:mx-2 bg-gray-200`}
      >
        <h5 className="m-auto text-center text-gray-800 py-24">
          Select a Food
        </h5>
      </div>
    );
  }
  return (
    <div className="border border-blue-600 shadow-outline flex-col bg-white p-3 mb-2 rounded-lg shadow-lg max-w-xs w-full sm:mx-2">
      <div className="flex justify-between mb-1">
        <h6 className="my-auto">Selected Food</h6>
        <Button
          color="green"
          loading={_isLoading}
          onClick={() => handleSubmit()}
          className="bg-green-500 hover:bg-green-400 text-white font-bold py-1 px-4 border-b-4 border-green-700 hover:border-green-500 rounded m-1"
        >
          Add
          {/* {_isLoading ? <LoadingSpinner white /> : "Add"} */}
        </Button>
      </div>
      <hr />
      <h5>{name && name}</h5>
      <p>{brand && brand}</p>
      <hr />
      <AmountInput
        isLiquid={isLiquid}
        servingOptions={servingOptionsWithDefaults}
        chosenServing={chosenServing}
        onAmountChange={onAmountChange}
        onSizeChange={onSizeChange}
      />
      <Table macros={adjustedMacros} />
    </div>
  );
}
