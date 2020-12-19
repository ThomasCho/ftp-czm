const inquirer = require('inquirer');

function pollingInquire(actions) {
  return new Promise((resolve) => {
    inquirer
      .prompt({
        type: 'input',
        name: 'action',
        message: `请问有什么可以帮到你？（${actions.join(', ')}）`,
        validate: function (input) {
          if (!actions.includes(input.split(' ')[0])) {
            return `请输入如 ${actions.join(', ')} 的命令`;
          }

          return true;
        },
      })
      .then(({ action }) => {
        resolve(action);
      });
  });
}

module.exports = pollingInquire;
