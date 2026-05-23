import os
import asyncio
from dotenv import load_dotenv
from pathlib import Path
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

load_dotenv(Path("../.env"))

SWIGGY_TOKEN = os.getenv("SWIGGY_ACCESS_TOKEN")
SWIGGY_URL = "https://mcp.swiggy.com/food"


async def call_tool(tool_name, arguments=None):
    if arguments is None:
        arguments = {}

    headers = {
        "Authorization": f"Bearer {SWIGGY_TOKEN}"
    }

    async with streamablehttp_client(
        SWIGGY_URL,
        headers=headers
    ) as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()

            result = await session.call_tool(
                tool_name,
                arguments
            )

            return result


def run_tool(tool_name, arguments=None):
    return asyncio.run(call_tool(tool_name, arguments))


def get_addresses():
    return run_tool("get_addresses")


def search_restaurants(address_id, query):
    return run_tool(
        "search_restaurants",
        {
            "addressId": address_id,
            "query": query
        }
    )


def get_menu(restaurant_id):
    return run_tool(
        "get_menu",
        {
            "restaurantId": restaurant_id
        }
    )