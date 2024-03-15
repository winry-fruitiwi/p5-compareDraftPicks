/**
 *  @author Winry
 *  @date 2024.1.14
 *
 *  Hello! I am Winry of the Nubcake Bakery, an unofficial team of four raiding
 *  buddies who do criterion dungeons in Final Fantasy XIV Endwalker.
 *  We are thinking of expanding our team to 8 raiding buddies, including Owen.
 *  This way we can do Pandaemonium Savages.
 *
 *  This project is like the p5.js version of py-util's compareDraftPicks
 *  tool for Magic: The Gathering. This tool allows you to quickly and easily
 *  compare the stats of multiple cards in the heat of an MTGA/MTGO draft,
 *  or even a game. However, unlike the python version, this version of
 *  compareDraftPicks should be able to operate completely on the screen when
 *  finished instead of relying on text.
 *
 */

let font
let fixedWidthFont
let variableWidthFont
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

// the string that you constantly modify by typing. Controls what cards
// show up in the "what are you searching for?" box underneath the search
// bar (WIP).
let query = ""

// toggle to display the cursor
let cursorDisplay = true

// where the master JSON is stored
let masterJSON

// all card names
let cardNames

// card names that are currently being queried for. Updated every time a
// key is pressed, in keyPressed().
let queriedCardNames = []

// the minimum height that the canvas needs to be to accommodate all the
// elements in the sketch
let requiredHeight = 0

// the cards I've selected after querying them
let selectedCards = []

// the cards I'm about to display after selecting them
let cardsToDisplay = []

// the amount to shift cardQueryDisplay down so that it does not overlap with
// cardDataDisplay
let cardQueryShiftY = 0

// if I just released the mouse
let mouseJustReleased = false

// the caliber of data I'm querying: top vs all players. false = all, true = top
let caliber = false

/* constants */
// the padding of the text box
const TEXT_BOX_PADDING = 4
// maximum characters allowed in the query
const MAX_QUERY_LENGTH = 32
// minimum width required for all elements in the sketch
const REQUIRED_WIDTH = 800


function preload() {
    font = loadFont('data/consola.ttf')
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')
}


function setup() {
    let cnv = createCanvas(600, 300)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 14)

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch</pre>`)

    debugCorner = new CanvasDebugCorner(5)

    masterJSON = loadJSON("master.json", gotData)
}


function gotData() {
    cardNames = Object.keys(masterJSON)
}


function draw() {
    if ((height !== requiredHeight) || (width !== REQUIRED_WIDTH)) {
        // make sure NOT to redraw after resizing
        resizeCanvas(REQUIRED_WIDTH, requiredHeight, true)
    }

    rectMode(CORNER)
    background(0, 0, 9)

    // does nothing currently
    cardDataDisplay()

    // no translation right now, but I need to do this so that
    // cardQueryDisplay() doesn't run into cardDataDisplay()'s
    // display. translation computed in cardDataDisplay()
    push()
    translate(0, cardQueryShiftY)

    cardQueryDisplay()
    pop()

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    // debugCorner.showBottom()

    mouseJustReleased = false

    if (frameCount > 3000)
        noLoop()
}


// displays the static card data module, which shows previously queried data
function cardDataDisplay() {
    // used for displaying card names
    let cellHeight = textHeight() + TEXT_BOX_PADDING*2

    // check if the data queried should be from top or all players using
    // the caliber variable
    let caliberQuery
    if (caliber) {
        caliberQuery = "Top"
    } else {
        caliberQuery = "All"
    }

    let caliberButtonText = `Toggle Caliber: ${caliberQuery}`

    noStroke()
    fill(0, 0, 50)
    rect(0, 0, textWidth(caliberButtonText) + 2*TEXT_BOX_PADDING, cellHeight)

    textAlign(LEFT, TOP)
    fill(0, 0, 80)
    text(caliberButtonText, TEXT_BOX_PADDING, TEXT_BOX_PADDING)


    for (let i=0; i < cardsToDisplay.length; i++) {
        textAlign(LEFT, TOP)

        let cardName = cardsToDisplay[i]

        // display alternating color rectangle
        noStroke()
        // this essentially alternates alpha between 0 and 20
        fill(0, 0, 100, (i + 1) % 2 * 5)
        rect(0, cellHeight * (i + 1),
            width, cellHeight
            )

        // display card name
        fill(0, 0, 80)
        text(cardName, TEXT_BOX_PADDING, cellHeight * (i + 1) + TEXT_BOX_PADDING)

        // display winrate
        textAlign(RIGHT, TOP)
        if (masterJSON[cardName]["stats"][caliberQuery]["all"]) {
            let gihWR = masterJSON[cardName]["stats"]["all"]["all"]["GIH WR"]

            // get the first three digits and round everything else away
            let formattedWR = round(gihWR * 1000)
            // after this, convert to a string
            formattedWR = str(formattedWR)
            // then add the decimal point
            formattedWR = formattedWR.slice(0, 2) + "." + formattedWR.slice(2)
            // finally, add the % at the end
            formattedWR += "%"

            text(formattedWR, width - TEXT_BOX_PADDING,
                cellHeight * (i + 1) + TEXT_BOX_PADDING)
        } else {
            text("No data", width - TEXT_BOX_PADDING,
                cellHeight * (i + 1) + TEXT_BOX_PADDING)
        }
    }

    cardQueryShiftY = cellHeight + cellHeight * cardsToDisplay.length
}

// displays the interactive card querying module, which handles querying each
// card and the "query data" button
function cardQueryDisplay() {
    textAlign(LEFT, TOP)

    fill(0, 0, 20)
    noStroke()
    // display a grayish box for the query to go in (assumes monospace font).
    // Also accounts for cursor.
    rect(0, 0,
        textWidth(" ")*(MAX_QUERY_LENGTH+1) + TEXT_BOX_PADDING*2,
        textHeight() + TEXT_BOX_PADDING*2
    )

    fill(0, 0, 80)
    // toggle cursorDisplay every 50 frames
    if (frameCount % 50 === 0)
        cursorDisplay = !cursorDisplay

    // display the cursor if cursorDisplay is true
    if (cursorDisplay)
        text(query + "|", TEXT_BOX_PADDING, TEXT_BOX_PADDING)
    else
        text(query, TEXT_BOX_PADDING, TEXT_BOX_PADDING)

    let cellHeight = textHeight() + TEXT_BOX_PADDING*2

    // iterate over all the queried cards
    for (let i = 0; i < queriedCardNames.length; i++) {
        let cardName = queriedCardNames[i]

        fill(0, 0, 40)

        // check if I'm hovering over this card name
        if (
            0 < mouseX &&
            cellHeight*(i+1) + cardQueryShiftY < mouseY &&
            mouseX < textWidth(" ")*(MAX_QUERY_LENGTH+1) + TEXT_BOX_PADDING*2 &&
            mouseY < cellHeight*(i+1) + textHeight() + TEXT_BOX_PADDING*2 + cardQueryShiftY
        ) {
            fill(0, 0, 30)

            // if I also just clicked on this card, either add it to or remove
            // it from the list of cards selected
            if (mouseJustReleased) {

                if (!selectedCards.includes(cardName))
                    selectedCards.push(cardName)
                else {
                    let cardIndex = selectedCards.indexOf(cardName)
                    // starting from cardIndex, remove 1 element
                    selectedCards.splice(cardIndex, 1)
                }
            }
        }
        if (selectedCards.includes(cardName)) {
            fill(100, 60, 60)

            if (
                0 < mouseX &&
                cellHeight*(i+1) + cardQueryShiftY < mouseY &&
                mouseX < textWidth(" ")*(MAX_QUERY_LENGTH+1)+TEXT_BOX_PADDING*2 &&
                mouseY < cellHeight*(i+1) + textHeight() + TEXT_BOX_PADDING*2 + cardQueryShiftY
            ) {
                fill(100, 60, 50)
            }
        }

        strokeWeight(1)
        stroke(0, 0, 0)
        rect(0,
            cellHeight*(i + 1),
            textWidth(" ")*(MAX_QUERY_LENGTH+1) + TEXT_BOX_PADDING*2,
            textHeight() + TEXT_BOX_PADDING*2
        )

        fill(0, 0, 80)
        noStroke()
        text(cardName,
            TEXT_BOX_PADDING,
            TEXT_BOX_PADDING + cellHeight*(i+1))
    }

    // also display all the cards ready to display
    for (let i = 0; i < selectedCards.length; i++) {
        let cardName = selectedCards[i]
        // display them in the same manner as last time, just without
        // the background or border
        fill(0, 0, 80)
        noStroke()
        // *3 because we want to display this to the right of the text box
        // plus a small margin/padding
        text(cardName,
            textWidth(" ")*(MAX_QUERY_LENGTH+1) + TEXT_BOX_PADDING*3,
            TEXT_BOX_PADDING + cellHeight*(i))
    }

    let longestListLength = max(queriedCardNames.length+1, selectedCards.length)

    requiredHeight = cardQueryShiftY
    requiredHeight += TEXT_BOX_PADDING + cellHeight*(longestListLength)

    // adds the "Query Data" button at the top.
    // note that "Query Data (WIP)" is displayed if I'm still working on it.
    fill(0, 0, 40)
    // coordinates for the rect. This is just to make the hover check simpler.
    let topLeftQueryPos = new p5.Vector(
        width - textWidth("Query Data (WIP)") - TEXT_BOX_PADDING * 2, 0
    )

    let bottomRightQueryPos = new p5.Vector(
        width, textAscent() + textDescent() + TEXT_BOX_PADDING * 2
    )

    if (
        topLeftQueryPos.x < mouseX &&
        topLeftQueryPos.y + cardQueryShiftY < mouseY &&
        mouseX < bottomRightQueryPos.x &&
        mouseY < bottomRightQueryPos.y + cardQueryShiftY
    ) {
        fill(0, 0, 30)

        if (mouseJustReleased) {
            cardsToDisplay = selectedCards.slice()

            for (let i = 0; i < selectedCards.length; i++) {
                let cardName = selectedCards[i]

                console.log(`${cardName}: ` +
                    JSON.stringify(masterJSON[cardName], null, 2)
                )
            }
        }
    }

    rect(width - textWidth("Query Data (WIP)") - TEXT_BOX_PADDING * 2, 0,
        textWidth("Query Data (WIP)") + TEXT_BOX_PADDING * 2,
        textAscent() + textDescent() + TEXT_BOX_PADDING * 2)


    textAlign(RIGHT, TOP)
    fill(0, 0, 80)
    text("Query Data (WIP)", width - TEXT_BOX_PADDING, TEXT_BOX_PADDING)
}


function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    if (key === '`') { /* toggle debug corner visibility */
        debugCorner.visible = !debugCorner.visible
        console.log(`debugCorner visibility set to ${debugCorner.visible}`)
    }

    // if the user pressed anything other than a modifier key, modify the
    // query string accordingly. Otherwise, remove the last character from
    // the query. Also, if the length of the query exceeds the maximum
    // character cap, don't add the character.
    if (key !== "`" && key.length === 1 && query.length < MAX_QUERY_LENGTH) {
        query += key
    } else if (keyCode === BACKSPACE)
        // delete the last element of query
        query = query.slice(0, -1)

    // find list of all cards that include the query
    let queriedCards = {}
    for (let cardName of cardNames) {
        // do a search that's not case-sensitive
        let cardNameQuery = cardName.toLowerCase().indexOf(query.toLowerCase())
        if (cardNameQuery !== -1) {
            queriedCards[cardName] = cardNameQuery
        }
    }

    // sort the queried cards by where they were found
    let queriedCardEntries = Object.entries(queriedCards)
    queriedCardEntries.sort((a, b) => a[1] - b[1])

    queriedCards = {}
    for (const [key, value] of queriedCardEntries) {
        queriedCards[key] = value
    }

    queriedCardNames = Object.keys(queriedCards)

    if (query.length === 0) {
        queriedCardNames = []
    }
}


// just a code cleanup function
function textHeight() {
    return textAscent() + textDescent()
}


function mouseReleased() {
    mouseJustReleased = true
}


/** 🧹 shows debugging info using text() 🧹 */
class CanvasDebugCorner {
    constructor(lines) {
        this.visible = true
        this.size = lines
        this.debugMsgList = [] /* initialize all elements to empty string */
        for (let i in lines)
            this.debugMsgList[i] = ''
    }

    setText(text, index) {
        if (index >= this.size) {
            this.debugMsgList[0] = `${index} ← index>${this.size} not supported`
        } else this.debugMsgList[index] = text
    }

    showBottom() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 14)

            const LEFT_MARGIN = 10
            const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
            const LINE_SPACING = 2
            const LINE_HEIGHT = textHeight() + LINE_SPACING

            /* semi-transparent background */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */
            rect(
                0,
                height,
                width,
                DEBUG_Y_OFFSET - LINE_HEIGHT * this.debugMsgList.length - TOP_PADDING
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            for (let index in this.debugMsgList) {
                const msg = this.debugMsgList[index]
                text(msg, LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT * index)
            }
        }
    }

    showTop() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 14)

            const LEFT_MARGIN = 10
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */

            /* offset from top of canvas */
            const DEBUG_Y_OFFSET = textAscent() + TOP_PADDING
            const LINE_SPACING = 2
            const LINE_HEIGHT = textHeight() + LINE_SPACING

            /* semi-transparent background, a console-like feel */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)

            rect( /* x, y, w, h */
                0,
                0,
                width,
                DEBUG_Y_OFFSET + LINE_HEIGHT*this.debugMsgList.length/*-TOP_PADDING*/
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            textAlign(LEFT)
            for (let i in this.debugMsgList) {
                const msg = this.debugMsgList[i]
                text(msg, LEFT_MARGIN, LINE_HEIGHT*i + DEBUG_Y_OFFSET)
            }
        }
    }
}
