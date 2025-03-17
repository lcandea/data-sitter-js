import io
import json
from typing import Callable, Dict, List, Union

import pandas as pd
from pyodide.ffi import JsProxy
from data_sitter import Contract, RuleRegistry


js_params: Dict[str, str] = {}


def result_response(result):
    return json.dumps({"success": True, "result": result}, default=str)


def error_response(error: str):
    return json.dumps({"success": False, "error": error}, default=str)


def pythonise(func: Callable):
    def _pythonise(*js_args, **js_kwargs):
        args = [arg.to_py() if isinstance(arg, JsProxy) else arg for arg in js_args]
        kwargs = {key: val.to_py() if isinstance(val, JsProxy) else val for key, val in js_kwargs.items()}
        try:
            return result_response(func(*args, **kwargs))
        except Exception as e:
            return error_response(str(e))
    return _pythonise


@pythonise
def validate_objects(contract: Union[str, dict], data: Union[str, list, dict]):
    if isinstance(contract, str):
        contract = json.loads(contract)
    validator = Contract.from_dict(contract)

    if isinstance(data, str):
        data = json.loads(data)
    if isinstance(data, dict):
        data = [data]
    elif not isinstance(data, list):
        raise ValueError('Data object must be a List or a Dict.')

    validated_obj = [validator.validate(item).to_dict() for item in data]
    return validated_obj


@pythonise
def validate_csv(contract: Union[str, dict], csv_data: str):
    if isinstance(contract, str):
        contract = json.loads(contract)
    validator = Contract.from_dict(contract)

    df = pd.read_csv(io.StringIO(csv_data))
    df = df.where(pd.notna(df), None)
    validated_obj = [
        validator.validate(item).to_dict()
        for item in df.to_dict(orient='records')
    ]
    return validated_obj


@pythonise
def get_front_end_contract(contract: str):
    contract_validator = Contract.from_dict(json.loads(contract))
    front_end_contract = contract_validator.get_front_end_contract()
    return front_end_contract


def get_field_definitions():
    return result_response(RuleRegistry.get_rules_definition())
