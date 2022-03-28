<template>
  <div style="background-color: var(--bs-bg); color: var(--bs-text-default);">
    <section class="CardArea">
      <div class="card">
        <div class="card-header">
          Your cart
        </div>
        <div class="card-body">
          <table style="width: 100%; font-size: 14px">
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Qty</th>
              <th></th>
            </tr>
            <tr v-for="(cartItem, index) of styled_cart()" :key="index">
              <td>{{ cartItem.name }}</td>
              <td>
                {{ $root.$children[0].api_capabilities.currency.symbol
                }}{{ priceFixer(cartItem.price) }}
              </td>
              <td>{{ cartItem.quantity }}</td>
              <td style="width: 20px" @click="remove_cart_item(cartItem.code)">
                <i
                  class="fas fa-times-circle clickable"
                  style="color:#F00000"
                ></i>
              </td>
            </tr>
          </table>

          <br />
          <h3>
            Total: {{ $root.$children[0].api_capabilities.currency.symbol
            }}{{ priceFixer(cart_total()) }}
          </h3>

          <button
            style="color: var(--bs-button-text);"
            class="btn btn-primary rightBottomBtn"
            :disabled="styled_cart().length == 0"
            @click="complete_order()"
          >
            <i
              class="fad fa-cart-arrow-down"
              style="color: var(--bs-button-text); position: relative; left: -2px; "
            ></i>
            Complete order
          </button>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          Add balance
        </div>
        <div class="card-body">
          <h5 class="card-title">
            Your current account balance:
            {{ $root.$children[0].api_capabilities.currency.symbol
            }}{{ priceFixer($root.$children[0].user.balance) }}
          </h5>
          <div class="card-text">
            <p style="margin-bottom: 1px">Order credit</p>
            <div class="input-group mb-3">
              <span class="input-group-text" id="basic-addon1">{{
                $root.$children[0].api_capabilities.currency.symbol
              }}</span>
              <input
                id="creditAmountAdding"
                type="number"
                class="form-control"
                placeholder="Amount"
                aria-label="Amount"
                value="5"
                max="100"
                min="5"
              />
            </div>
            <button
              @click="orderCredit()"
              style="float: right; color: var(--bs-button-text)"
              type="button"
              class="btn btn-primary"
            >
              <i
                class="fab fa-paypal"
                style="color: var(--bs-button-text); position: relative; left: -2px;"
              ></i>
              Pay with PayPal
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  mounted() {
    var vm = this;
    this.cart = JSON.parse(window.localStorage.getItem("cart"));

    fetch(`${vm.$root.$children[0].api_base_url}/@me/deploy`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
      },
    })
      .then((res) => {
        res.json().then((data) => {
          if (data.success == false) {
            vm.$root.$children[0].checkMessage(data);
          }
          vm.items = data.data;
        });
      })
      .catch((e) => {
        vm.$root.$children[0].reportError(
          {
            panel: vm.$router.path,
            request: `${vm.$root.$children[0].api_base_url}/@me/deploy`,
          },
          e
        );
      });
  },
  methods: {
    remove_cart_item(item_code) {
      var current_cart = this.styled_cart();
      var current_cart_item = current_cart.find((i) => i.code == item_code);
      if (current_cart_item.quantity == 1) {
        current_cart.splice(current_cart.indexOf(current_cart_item), 1);
      } else {
        current_cart_item.quantity = current_cart_item.quantity - 1;
      }

      var new_cart = [];

      for (var cart_item of current_cart) {
        for (let i = 0; i < cart_item.quantity; i++) {
          new_cart.push({
            service: cart_item.service,
            category_code: cart_item.category_code,
            item: cart_item.code,
          });
        }
      }

      this.cart = new_cart;
      window.localStorage.setItem("cart", JSON.stringify(new_cart));
    },
    complete_order() {
      var vm = this;
      var jobId = vm.$root.$children[0].createJob(
        `Please wait while your order is being completed.`
      );
      fetch(`${vm.$root.$children[0].api_base_url}/@me/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          coupon_code: null,
          items: vm.styled_cart(),
        }),
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            vm.$root.$children[0].stopJob(jobId);
            window.localStorage.setItem("cart", null);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].stopJob(jobId);
          vm.$root.$children[0].checkMessage({
            messages: [
              {
                isError: true,
                title: "Deployment",
                content: `API ERROR: ${e}`,
              },
            ],
          });
        });
      vm.$router.push({
        path: "/servers",
      });
    },
    orderCredit() {
      var amount = document.getElementById("creditAmountAdding").value;
      var vm = this;

      fetch(`${vm.$root.$children[0].api_base_url}/@me/creditorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          amount: amount,
        }),
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            if (data.success == false) {
              //dont continue
            } else {
              window.location.href = data.data.url;
            }
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/creditorder`,
            },
            e
          );
        });
      console.log(amount);
    },
    reset_cart() {
      window.localStorage.setItem("cart", null);
      this.cart = [];
    },
    cart_total() {
      var cart_items = this.styled_cart();

      var total = 0;

      for (var cart_item of cart_items) {
        total += cart_item.price * cart_item.quantity;
      }

      return total;
    },
    styled_cart() {
      var vm = this;
      var items = [];

      if (!vm.cart) return items;

      for (var item of this.cart) {
        if (item.service == "qemu") {
          var qemu_package = vm.items.vps.find((p) => p.code == item.item);
          var item_data = items.find(
            (i) => i.code == item.item && i.service == "qemu"
          );

          if (item_data) {
            if (item_data) item_data.quantity++;
          } else {
            items.push({
              code: item.item,
              category_code: null,
              service: item.service,
              price: qemu_package.price,
              name: `${qemu_package.name}`,
              quantity: 1,
            });
          }
        }
        if (item.service == "pterodactyl") {
          item_data = items.find(
            (i) => i.code == item.item && i.service == "pterodactyl"
          );
          var item_data_global_category = vm.items[item.service].find(
            (c) => c.code == item.category_code
          );
          if (item_data_global_category == null) return;
          var item_data_global = item_data_global_category.list.find(
            (i) => i.code == item.item
          );

          if (item_data) {
            if (item_data) item_data.quantity++;
          } else {
            items.push({
              code: item.item,
              category_code: item.category_code,
              service: item.service,
              price: item_data_global.price,
              name: `${item_data_global.name}`,
              quantity: 1,
            });
          }
        }
      }

      return items;
    },
    priceFixer(input) {
      var vm = this;
      if (input == undefined) return;
      vm.api_capabilities = vm.$root.$children[0].api_capabilities;
      if (input.toString().includes(".")) {
        var returnStr = (Math.round(input * 100) / 100)
          .toString()
          .replace(".", vm.api_capabilities.currency.separator);
        if (
          returnStr.split(vm.api_capabilities.currency.separator)[1] &&
          returnStr.split(vm.api_capabilities.currency.separator)[1].length == 1
        )
          returnStr += `0`;

        if (returnStr.split(vm.api_capabilities.currency.separator)[1] == null)
          returnStr += `${vm.api_capabilities.currency.separator}00`;

        return returnStr;
      } else {
        return input + `${vm.api_capabilities.currency.separator}00`;
      }
    },
  },

  data() {
    return {
      cart: [],
      items: [],
    };
  },
};
</script>

<style scoped>
.clickable {
  cursor: pointer;
}
.card-body a {
  color: var(--bs-text-default);
}
.CardArea {
  width: 95%;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.CardArea .card {
  background-color: var(--bs-card-bg);
  width: 400px;
  margin: 5px;
  flex-grow: 1;
}
.CardArea .card .card-header {
  background-color: var(--bs-card-header-bg);
}

@media only screen and (max-width: 1200px) {
  .CardArea {
    width: 95%;
  }
}

@media only screen and (min-width: 800px) {
  .rightBottomBtn {
    position: absolute;
    right: 15px;
    bottom: 15px;
  }
}

@media only screen and (max-width: 800px) {
  .CardArea {
    width: 99%;
  }
  .btn {
    width: 100%;
  }
}
</style>
