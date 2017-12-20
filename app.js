// BUDGET CONTROLLER
var budgetController = (function () {

    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalIncome) {
        if(totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };
    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };
    var calculateTotal = function (type) {
        var sum = 0;
        data.allItems[type].forEach(function (cur) {
            sum += cur.value;
        });
        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };

    return {
        addItem: function (type, des, val) {
            var newItem, ID;
            // [1,2,3,4] ID = 5;
            // [1,3,5,6] ID = 7 not 5
            // ID = lastID + 1

            // Create new ID
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }
            // Create new item based on 'inc' or 'exp' type
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }

            // Push our new item into our data structure
            data.allItems[type].push(newItem);
            return newItem;
        },
        deleteItem: function(type, id) {
            var ids, index;

            // [1,3,(5),6] = id: 5
            // [1,3,(5),6] = index: 2
            // [1,3,6]

            // Create brand new array from the  allItems[type] array
            ids = data.allItems[type].map(function(current) {
                return current.id;
            });

            // Returns the index number of the received id from the ids array
            index = ids.indexOf(id);

            // Delete the matched data index from our data structure
            if(index !== -1) {
              data.allItems[type].splice(index, 1);
            }
        },
        calculateBudget: function () {

            // Calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');

            // Calcualate the budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the percentage of income that we spent
            if (data.totals.inc > 0) {
                // round of ((expenses / income) x 100)
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1; // income = -1
            }
        },
        getBudget: function () {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },
        calculatePercentages: function() {
            // Exp1: 10 - 10/100 = 10%
            // Exp2: 20 - 20/100 = 20%
            // Exp3: 30 - 30/100 = 30%
            // Total Income: 100
            // Percentage = round of (expense / totalIncome) * 100)

            // Calculate percentages for each item
            data.allItems.exp.forEach(function(cur) {
                cur.calcPercentage(data.totals.inc);
            });
        },
        getPercentages: function() {
            // Return each item percentage and return AllPerc new array
            var AllPerc = data.allItems.exp.map(function(cur) {
                return cur.getPercentage();
            });
            return AllPerc;
        },
        testing: function () {
            console.log(data);
        }
    };
})();


// UI CONTROLLER
var UIController = (function () {

    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensePercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };

    var formatNumber = function(num, type) {
        var numSplit, int, dec, sign;
        // 1. Add 2 decimal points
        // 2. Add a comma separating thousands
        // 3. Add prefix + for income and - for expenses
        // 4. Combine all

        // 2310.4567 -> + 2,310.46
        // 2000 -> + 2,000.00

        // 1
        num = Math.abs(num);
        num = num.toFixed(2);

        // 2
        numSplit = num.split('.');
        int = numSplit[0];

        if(int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
        }
        dec = numSplit[1];

        // 3 & 4
        if(num !== '0.00') {
            // Add sign when it is not 0
            sign = (type === 'inc' ? '+' : '-');
            return sign + ' ' + int + '.' + dec;
        } else {
            return ' ' + int + '.' + dec;
        }
    };

    // Created our own node list for each method
    var nodeListForEach = function(list, callback) {
        for(var i = 0; i < list.length; i++) {
            // Call callback function for each items that we have
            callback(list[i], i);
        }
    };

    return {
        getInput: function () {
            return {
                type: document.querySelector(DOMstrings.inputType).value, // inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },
        addListItem: function (obj, type) {
            var html, newHtml;

            // Create HTML string with placeholder text
            if (type === 'inc') {
                // Get the income items container
                element = DOMstrings.incomeContainer;
                // Store
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                // Get the income items container
                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // Replace the placeholder text with some actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // Insert the HTMl into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeEnd', newHtml);
        },
        removeListItem: function(selectorID) {
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
        },
        clearFields: function () {
            var fields, fieldsArr;

            // Get input description and input value
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

            // Convert "fields" from list type to array type
            fieldsArr = Array.prototype.slice.call(fields);
    
            // Clear input fields
            fieldsArr.forEach(function (current, index, array) {
                current.value = "";
            });

            // Focus to the first input
            fieldsArr[0].focus();
        },
        displayBudget: function (obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

            // Show "--" if percentage is -1 or 0 else show percentage
            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + "%";
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = "---";
            }
        },
        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMstrings.expensePercLabel);

            nodeListForEach(fields, function(cur, index) {
                if(percentages[index] > 0) {
                    cur.textContent = percentages[index] + '%';
                } else {
                    cur.textContent = '---';
                }
            });
        },
        displayDate: function() {
            var now, month, months, year;

            now = new Date();
            months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            month = now.getMonth();
            year = now.getFullYear();
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
        },
        changedType: function() {
            var fields = document.querySelectorAll(DOMstrings.inputType + ', ' + DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            nodeListForEach(fields, function(cur) {
                cur.classList.toggle('red-focus');
            });
            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },
        getDOMstrings: function () {
            return DOMstrings;
        }
    };

})();


// GLOBAL APP CONTROLLER
var controller = (function (budgetCtrl, UICtrl) {

    // Setup event listeners
    var setupEventListeners = function () {
        var DOM = UICtrl.getDOMstrings();

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function (event) {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    };

    // Calculate and update Budget Function
    var updateBudget = function () {
        // 1. Calculate the budget
        budgetCtrl.calculateBudget();

        // Return the budget
        var budget = budgetCtrl.getBudget();

        // 6. Display the budget on the UI
        UICtrl.displayBudget(budget);
    };

    // Calculate and update Percentages Function
    var updatePercentages = function() {

        // 1. Calculate the percentages
        budgetCtrl.calculatePercentages();

        // 2. Get the percetanges
        var percentages = budgetCtrl.getPercentages();

        // 3. Display the percentages on the UI
        UICtrl.displayPercentages(percentages);
    };

    // Add Item Function
    var ctrlAddItem = function () {
        var input, newItem;

        // 1. Get the field input data
        input = UICtrl.getInput();

        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {

            // 2. Add the item to the budget  controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add the item to the UI
            UICtrl.addListItem(newItem, input.type);

            // 4. Clear fields
            UICtrl.clearFields();

            // 5. Calculate & update budget
            updateBudget();

            // 6. Calculate & update percentages
            updatePercentages();
        }
    };

    // Delete Item Function
    var ctrlDeleteItem = function (event) {
        var itemID, splitID, type, ID;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        // inc-1 or exp-1
        if (itemID) {
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);
        
            // 1. Delete the item from the data structure
            budgetCtrl.deleteItem(type, ID);

            // 2. Delete the item from the UI
            UICtrl.removeListItem(itemID);

            // 3. Update and display the new budget
            updateBudget();

            // 4. Calculate & update percentages
            updatePercentages();
        }
    };

    return {
        init: function () {
            console.log('App has been started..');
            // Display month
            UICtrl.displayDate();
            // Initialize reset values
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });

            // Initialize event listeners
            setupEventListeners();
        }
    };

})(budgetController, UIController);

controller.init();