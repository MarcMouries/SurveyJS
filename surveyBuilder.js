class SurveyBuilder {

    constructor(json, containerId) {
        this.json = json;
        this.surveyContainer = document.getElementById(containerId);
        this.questionNumber = 1;
        this.createSurvey();
    }

    createSurvey() {
        this.json.questions.forEach(element => {
            switch (element.type) {
                case "ranking":
                    this.createRankingQuestion(element, this.surveyContainer);
                    break;
                case "single-line-text":
                    this.createSingleLineTextQuestion(element, this.surveyContainer);
                    break;
                case "multi-line-text":
                    this.createMultiLineTextQuestion(element, this.surveyContainer);
                    break;
                default:
                    console.error("Unsupported question type:", element.type);
            }
        });

        this.addDragAndDrop();
        this.createCompleteButton(this.surveyContainer);
    }

    createQuestionTitle(questionText) {
        const title = document.createElement('h3');
        title.className = 'question-title';

        const questionNumberSpan = document.createElement('span');
        questionNumberSpan.className = 'question-number';
        questionNumberSpan.textContent = `Q${this.questionNumber}. `;
        title.appendChild(questionNumberSpan);

        title.append(questionText);

        this.questionNumber++;

        return title;
    }

    createSingleLineTextQuestion(element, container) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';

        const title = this.createQuestionTitle(element.title);
        questionDiv.appendChild(title);

        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.name = element.name;
        inputField.required = element.isRequired;
        inputField.className = 'single-line-text-input';
        questionDiv.appendChild(inputField);

        container.appendChild(questionDiv);
    }

    createMultiLineTextQuestion(element, container) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';

        const title = this.createQuestionTitle(element.title);
        questionDiv.appendChild(title);

        const textArea = document.createElement('textarea');
        textArea.name = element.name;
        textArea.required = element.isRequired;
        textArea.className = 'multi-line-text-input'; // CSS class for styling
        textArea.placeholder = 'Enter your comments here...'; // Optional placeholder text
        questionDiv.appendChild(textArea);

        container.appendChild(questionDiv);
    }

    createRankingQuestion(element, container) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';

        const title = this.createQuestionTitle(element.title);
        questionDiv.appendChild(title);

        const rankingList = document.createElement('div');
        rankingList.className = `ranking-list ${element.name}`;


        element.choices.forEach((choice, index) => {
            const listItem = document.createElement('div');
            listItem.setAttribute('draggable', true);
            listItem.className = 'ranking-item';

            const dragIcon = document.createElement('div');
            dragIcon.className = 'drag-icon';
            dragIcon.textContent = '≡';
            listItem.appendChild(dragIcon);

            const indexDiv = document.createElement('div');
            indexDiv.className = 'index';
            indexDiv.textContent = index + 1;
            listItem.appendChild(indexDiv);

            const choiceText = document.createElement('div');
            choiceText.className = 'choice-text';
            choiceText.textContent = choice;
            listItem.appendChild(choiceText);

            rankingList.appendChild(listItem);
        });

        questionDiv.appendChild(rankingList);
        container.appendChild(questionDiv);
    }
    addDragAndDrop() {
        const lists = document.querySelectorAll('.ranking-list');

        lists.forEach(list => {
            list.addEventListener('dragover', e => {
                e.preventDefault();
                const draggable = document.querySelector('.dragging');
                const afterElement = this.getDragAfterElement(list, e.clientY);
                if (afterElement) {
                    list.insertBefore(draggable, afterElement);
                } else if (draggable) {
                    list.appendChild(draggable);
                }
                this.updateDraggedItemIndex(draggable, list);
            });

            list.addEventListener('dragstart', e => {
                e.target.classList.add('dragging');
            });

            list.addEventListener('dragend', e => {
                e.target.classList.remove('dragging');
                this.updateAllIndexes(list);
            });

            // If you have a 'drop' event, you can also update indexes there
            list.addEventListener('drop', e => {
                e.preventDefault();
                this.updateAllIndexes(list);
            });
        });
    }

    createCompleteButton(container) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        const completeButton = document.createElement('button');
        completeButton.className = 'complete-button';
        completeButton.textContent = 'Complete';
        completeButton.addEventListener('click', () => this.printSurveyResults());
        buttonContainer.appendChild(completeButton);
        container.appendChild(buttonContainer);
    }

    printSurveyResults() {
        const surveyData = {
            responses: []
        };

        this.json.questions.forEach(element => {
            const questionData = {
                questionName: element.name,
                questionTitle: element.title,
                answer: null
            };

            switch (element.type) {
                case 'single-line-text':
                    const textInput = this.surveyContainer.querySelector(`input[name="${element.name}"]`);
                    questionData.answer = textInput ? textInput.value : '';
                    break;

                case 'ranking':
                    const rankingItems = Array.from(this.surveyContainer.querySelectorAll(`.${element.name} .ranking-item`));
                    console.log(rankingItems);
                    if (rankingItems.length) {
                        questionData.answer = rankingItems.map((item, idx) => ({
                            rank: idx + 1,
                            text: item.querySelector('.choice-text').textContent.trim()
                        }));
                    }
                    break;

                // Handle other question types if necessary
            }

            surveyData.responses.push(questionData);
        });

        console.log("Survey Results:", JSON.stringify(surveyData, null, 2));
    }




    // MOVE DRAG and Drop with the  necessary methods such as getDragAfterElement, updateDraggedItemIndex, updateAllIndexes into a separate file...

    getDragAfterElement(list, y) {
        const draggableElements = [...list.querySelectorAll('.ranking-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }


    updateDraggedItemIndex(draggedItem, list) {
        let newIndex = 0;
        Array.from(list.children).forEach((item, index) => {
            if (item !== draggedItem && item.getBoundingClientRect().top < draggedItem.getBoundingClientRect().bottom) {
                newIndex = index + 1;
            }
        });

        const indexDiv = draggedItem.querySelector('.index');
        if (indexDiv) {
            indexDiv.textContent = newIndex + 1; // +1 because index is 0-based
        }
    }


    updateAllIndexes(list) {
        const items = list.querySelectorAll('.ranking-item');
        items.forEach((item, index) => {
            const indexDiv = item.querySelector('.index');
            if (indexDiv) {
                indexDiv.textContent = index + 1;
            }
        });
    }

}

//export default SurveyBuilder;
// Attach SurveyBuilder to the window object to make it globally accessible
window.SurveyBuilder = SurveyBuilder;