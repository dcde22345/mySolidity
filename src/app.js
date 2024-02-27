App = {
  loading: false,
  contracts: {},

  load: async () => {
    // load app...
    await App.loadWeb3();
    await App.loadAccount();
    await App.loadContract();
    await App.render();
  },

  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  loadWeb3: async () => {
    if (typeof window.ethereum !== "undefined") {
      // Use Mist/MetaMask's provider
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        web3 = new Web3(window.ethereum);
      } catch (err) {
        console.log(err.message);
      }
    } else {
      // Handle the case where the user doesn't have web3. Probably
      // show them a message telling them to install Metamask in
      // order to use our app.
      console.log("Please install Metamask");
    }
  },

  loadAccount: async () => {
    // Set the current blockchain account
    const userAccount = await web3.eth.getAccounts();
    App.account = userAccount[0];
  },

  loadContract: async () => {
    // Create a JavaScript version of the smart contract
    const todoList = await $.getJSON("TodoList.json");
    App.contracts.TodoList = TruffleContract(todoList);
    App.contracts.TodoList.setProvider(window.ethereum);

    // Hydrate the smart contract with values from the blockchain
    App.todoList = await App.contracts.TodoList.deployed();
  },

  render: async () => {
    if (App.loading) {
      return;
    }
    App.setLoading(true);

    $("#account").html(App.account);

    await App.renderTask();

    App.setLoading(false);
  },

  renderTask: async () => {
    // Load the total task count from the blockchain
    const taskCount = await App.todoList.taskCount();
    const $taskTemplate = $(".taskTemplate");
    let $newTaskTemplate;

    // Render out each task with a new task template
    for (let i = 1; i <= taskCount; i++) {
      // Fetch the task data from the blockchain
      const task = await App.todoList.tasks(i);
      const taskId = task[0].toNumber();
      const taskContent = task[1];
      const taskCompleted = task[2];

      // Create the html for the task
      $newTaskTemplate = $taskTemplate.clone();
      $newTaskTemplate.find(".content").html(taskContent);
      $newTaskTemplate
        .find("input")
        .prop("name", taskId)
        .prop("checked", taskCompleted)
        .on("click", App.toggleCompleted);

      // Put the task in the correct list
      if (taskCompleted) {
        $("#completedTaskList").append($newTaskTemplate);
      } else {
        $("#taskList").append($newTaskTemplate);
      }
    }
    // Show the task
    $newTaskTemplate.show();
  },

  setLoading: (bool) => {
    App.loading = bool;
    const loader = $("#loader");
    const content = $("#content");
    if (bool) {
      loader.show();
      content.hide();
    } else {
      loader.hide();
      content.show();
    }
  },
};

$(() => {
  $(window).load(() => {
    App.load();
  });
});
