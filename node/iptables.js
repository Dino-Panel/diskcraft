var fs = require("fs");
const { exec } = require("child_process");

module.exports.create_forward_rule = create_forward_rule;
module.exports.list_forward_rules = list_forward_rules;
module.exports.delete_forward_rule = delete_forward_rule;
module.exports.delete_all_rules_assigned_to_ip =
  delete_all_rules_assigned_to_ip;
module.exports.find_free_port = find_free_port;

function list_forward_rules() {
  return new Promise((res) => {
    var command = `iptables -L -n -t nat --line-number`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        rej(error.message);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        rej(stderr);
        return;
      }
      res(await iptables_nat_parser(stdout));
    });
  });
}

function iptables_nat_parser(data) {
  return new Promise(async (res) => {
    var lines = data.split("\n");
    var chains = [""];
    var current_chain_index = 0;

    for (var line of lines) {
      if (line == "") {
        current_chain_index = current_chain_index + 1;
        chains[current_chain_index] = "";
      } else {
        chains[current_chain_index] += line + "\n";
        //console.log(line);
      }
    }

    var nat_chain = chains.find((c) => c.includes("Chain PREROUTING"));
    var chain_lines = nat_chain.split("\n").splice(2, nat_chain.length);

    res(await nat_chain_line_parser(chain_lines));
  });
}

function nat_chain_line_parser(lines) {
  var forward_rules = [];
  return new Promise((res) => {
    for (var line of lines) {
      if (line != "") {
        var data_lines = line.split(" ").filter((l) => l != "");
        //make sure to ignore docker rules
        if (data_lines[1].includes("DOCKER") == false) {
          forward_rules.push({
            rule_id: data_lines[0],
            type: data_lines[2],
            public_port: data_lines[7].split(":")[1],
            private_ip: data_lines[8].split(":")[1],
            private_port: data_lines[8].split(":")[2],
          });
        }
      }
    }
    res(forward_rules);
  });
}

function find_free_port() {
  return new Promise(async (res) => {
    var port = null;
    var used_ports = await list_forward_rules();
    while (port == null) {
      var port_try = Math.floor(Math.random() * 5000) + 20000;
      var port_search = used_ports.find((p) => p.public_port == port_try);
      if (!port_search) port = port_try;
    }
    res(port);
  });
}

function create_forward_rule(
  private_ip,
  private_port,
  public_port,
  type = "tcp"
) {
  return new Promise((res) => {
    var command = `iptables -t nat -A PREROUTING -i enp41s0 -p ${type} --dport ${public_port} -j DNAT --to ${private_ip}:${private_port}`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        rej(error.message);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        rej(stderr);
        return;
      }
      res(true);
    });
  });
}

function delete_forward_rule(public_port) {
  return new Promise(async (res) => {
    var forward_rules = await list_forward_rules();

    var target_rule = forward_rules.find((r) => r.public_port == public_port);

    if (target_rule) {
      var command = `iptables -t nat -D PREROUTING ${target_rule.rule_id}`;
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        setTimeout(() => {
          res();
        }, 200);
      });
    }
  });
}

function delete_all_rules_assigned_to_ip(private_ip) {
  return new Promise(async (res) => {
    var forward_rules = await await list_forward_rules();
    var vm_rules = forward_rules.filter((r) => r.private_ip == private_ip);

    for (var rule of vm_rules) {
      await delete_forward_rule(rule.public_port);
    }
    res();
  });
}

// async function run() {
//   console.log(await create_forward_rule("10.0.4.2", "80", "2503"));
//   console.log(await delete_all_rules_assigned_to_ip("10.0.4.2"));
//   console.log(await list_forward_rules());
// }
// run();
