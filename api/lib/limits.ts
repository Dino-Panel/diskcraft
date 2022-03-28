import { mysqlQuery } from "./mysql";

//bypass for now
function parse_order_for_limits(cart, user) {
  return new Promise(async (res) => {
    var parsed_cart = [];
    var limits: any = await get_limits();

    var qemu_servers: any = await mysqlQuery(
      `SELECT * FROM qemu_servers_2 WHERE type != '' AND server_user = '${user.id}'`
    );

    var cart_qemu_items = cart.filter((c) => c.service == "qemu");

    //see if limits are reached with existing items - DON'T FORGET TO FINISH
    for (var qemu_server of qemu_servers) {
      console.log(qemu_server);
    }

    for (var qemu_cart_item of cart_qemu_items) {
      var limit_item = limits.find(
        (l) => l.limit_item == `qemu.${qemu_cart_item.code}`
      );

      if (limit_item) {
        console.log(limit_item);
      } else {
        parsed_cart.push(qemu_cart_item);
      }
    }

    res({
      cart: [],
      messages: [],
    });
  });
}

function get_limits() {
  return new Promise(async (res) => {
    var raw_list: any = await mysqlQuery(`SELECT * FROM limits`);
    var limits = [];
    for (var limit of raw_list) {
      limits[limit.item] = {
        limit_item: limit.item,
        limit_value: limit.value,
        user_owned: 0,
        reached: false,
      };
    }
    res(limits);
  });
}

export { parse_order_for_limits };
