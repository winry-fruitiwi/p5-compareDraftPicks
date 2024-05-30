/**
 *  @author Winry
 *  @date 2024.1.14
 *
 *  Hello! I am Winry of the Nubcake Bakery, an unofficial team of four raiding
 *  buddies who do criterion dungeons in Final Fantasy XIV Endwalker.
 *  We are currently out of service to prepare for Dawntrail.
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
// bar.
let query = ""

// dictionary that holds the card's PNGs
let cardPNGs = {}

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

// the type of data I'm querying: GIH, OH, or GD
let queriedWR = "GIH"

// color pair of data I'm querying
let colorPair = "all"

let colorStrip

let cellHeight

// used in selecting items using arrow keys rather than mouse
let selectedIndex = 0

// on I just released enter. used for selecting items using arrow keys
let enterJustPressed = false

// whether I should display the query module or the stats module. true =
// stats, false = query
let statOrQueryDisplay = false

// calls displayCard if this flag is true
let ifDisplayCard = false

// the card whose image must be displayed
let cardImgName

/* constants */
// the padding of the text box
const TEXT_BOX_PADDING = 4
// maximum characters allowed in the query
const MAX_QUERY_LENGTH = 32
// minimum width required for all elements in the sketch. don't resize this
// below 900 or else elements will collide, and also don't go over 1200 or
// else it's a bit too wide.
const REQUIRED_WIDTH = 950
// margin between each element in the header (i.e. the distance between
// "grade" and "GIH WR"
const ELEMENT_MARGIN = 40


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
        numpad 1 → freeze sketch
        ctrl+enter → toggle between card stats and query display
        ctrl+backspace → delete ENTIRE query, not to last space/symbol
        click on card stat row to see card image</pre>`)

    debugCorner = new CanvasDebugCorner(5)

    masterJSON = loadJSON("master.json", gotData)

    colorStrip = new ColorStrip()

    cellHeight = textHeight() + TEXT_BOX_PADDING*2

    // hides the cursor for display later, then hides its initial position
    noCursor()
    mouseX = -20
    mouseY = -20
}


function gotData() {
    cardNames = Object.keys(masterJSON)

    for (let key of cardNames) {
        cardPNGs[key] = masterJSON[key]["png"]
    }
}


function draw() {
    if ((height !== requiredHeight) || (width !== REQUIRED_WIDTH)) {
        // make sure NOT to redraw after resizing
        resizeCanvas(REQUIRED_WIDTH, requiredHeight, true)
    }

    rectMode(CORNER)
    background(0, 0, 9)

    if (statOrQueryDisplay) {
        cardDataDisplay()
    } else {
        cardQueryDisplay()
    }

    // no translation right now, but I need to do this so that
    // cardQueryDisplay() doesn't run into cardDataDisplay()'s
    // display. translation computed in cardDataDisplay()
    // push()
    // translate(0, cardQueryShiftY)
    //
    // cardQueryDisplay()
    // pop()

    mouseJustReleased = false
    enterJustPressed = false

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    // debugCorner.showBottom()

    // if (frameCount > 3000)
    //     noLoop()

    if (mouseIsPressed) {
        ifDisplayCard = false
    }

    // if the user is currently holding down backspace and it's the first
    // frame, change the backspaceDownStart time to the current frame.
    // otherwise, change it to false if backspace is not down. finally, if
    // the backspaceDownStart key has been down for longer than 1000ms,
    // start rapidly deleting characters from the end of the query.
    if (keyIsDown(BACKSPACE)) {

    }

    if (ifDisplayCard) {
        displayCardImage(cardImgName)
    }

    displayMouseCursor()
}


// displays the mouse as a white dot on the screen that changes to a darker
// orange when the mouse is down. used mainly for filming videos of my
// project so that viewers can see more easily what I'm doing with the
// mouse. Unfortunately leads to hiccups where the screen is resized and the
// mouse cursor point stays in place.
function displayMouseCursor() {
    strokeWeight(10)
    stroke(0, 0, 100)

    if (mouseIsPressed) {
        stroke(30, 80, 80)
        strokeWeight(8)
    }

    point(mouseX, mouseY)
}


// displays the static card data module, which shows previously queried data
function cardDataDisplay() {
    cardQueryShiftY = 0

    // check if the data queried should be from top or all players using
    // the caliber variable
    let caliberQuery, caliberText
    if (caliber) {
        caliberText = "Top"
        caliberQuery = "top"
    } else {
        caliberText = "All"
        caliberQuery = "all"
    }

    let caliberButtonText = `Toggle Caliber: ${caliberText}`

    textAlign(LEFT, TOP)
    renderButton(
        caliberButtonText,
        0,
        0,
        textWidth(caliberButtonText) + 2*TEXT_BOX_PADDING,
        cellHeight,
        () => {fill(0, 0, 30)}, // hover callback function
        () => {caliber = !caliber}, // click callback function
        color(0, 0, 40),
        color(0, 0, 80)
    )

    // color strip display
    let circleStartPos = textWidth(caliberButtonText) + 2*TEXT_BOX_PADDING + 50
    colorStrip.render(circleStartPos, cellHeight/2)

    let currentlySelected = colorStrip.currentlySelected()

    noStroke()
    fill(0, 0, 80)
    textAlign(LEFT, TOP)
    text("queried pair: " + colorPair,
        width/2, TEXT_BOX_PADDING)

    if (currentlySelected.length === 2) {
        let buttonText = "select: " + currentlySelected

        textAlign(LEFT, TOP)
        renderButton(
            buttonText,                                         //text
            width - TEXT_BOX_PADDING*2 - textWidth(buttonText), // x
            0,                                                  // y
            TEXT_BOX_PADDING * 2 + textWidth(buttonText),       // w
            cellHeight,                                         // h
            () => {fill(0, 0, 30)},                             // onHover
            () => {colorPair = currentlySelected.toLowerCase()},// onClick
            color(0, 0, 40),                                    // rectFill
            color(0, 0, 80)                                     // textFill
        )
    }

    else if (currentlySelected.length === 0) {
        let buttonText = "select: all"

        textAlign(LEFT, TOP)
        renderButton(
            buttonText,                                         //text
            width - TEXT_BOX_PADDING*2 - textWidth(buttonText), // x
            0,                                                  // y
            TEXT_BOX_PADDING * 2 + textWidth(buttonText),       // w
            cellHeight,                                         // h
            () => {fill(0, 0, 30)},                             // onHover
            () => {colorPair = "all"},// onClick
            color(0, 0, 40),                                    // rectFill
            color(0, 0, 80)                                     // textFill
        )
    }

    else {
        textAlign(RIGHT, TOP)
        fill(0, 0, 80)
        text("please select 0 or 2 colors",
            width - TEXT_BOX_PADDING,
            TEXT_BOX_PADDING)
    }

    push()

    // button that changes which winrate type the element is sorted by
    let ohFill = color(0, 0, 40)
    let gihFill = color(0, 0, 40)
    let gdFill = color(0, 0, 40)

    if (queriedWR === "OH") {
        ohFill = color(0, 0, 35)
    }

    if (queriedWR === "GIH") {
        gihFill = color(0, 0, 35)
    }

    if (queriedWR === "GD") {
        gdFill = color(0, 0, 35)
    }

    textAlign(LEFT, TOP)
    renderButton(
        "OH",
        0,
        TEXT_BOX_PADDING + cellHeight,
        textWidth("OH") + TEXT_BOX_PADDING * 2,
        textHeight() + TEXT_BOX_PADDING * 2,
        () => {fill(0, 0, 30)},
        () => {queriedWR = "OH"},
        ohFill,
        color(0, 0, 80)
    )

    renderButton(
        "GIH",
        textWidth("OH") + TEXT_BOX_PADDING * 3,
        TEXT_BOX_PADDING + cellHeight,
        textWidth("GIH") + TEXT_BOX_PADDING * 2,
        textHeight() + TEXT_BOX_PADDING * 2,
        () => {fill(0, 0, 30)},
        () => {queriedWR = "GIH"},
        gihFill,
        color(0, 0, 80)
    )

    renderButton(
        "GD",
        textWidth("OH") + TEXT_BOX_PADDING * 3 + textWidth("GIH") + TEXT_BOX_PADDING * 3,
        TEXT_BOX_PADDING + cellHeight,
        textWidth("GD") + TEXT_BOX_PADDING * 2,
        textHeight() + TEXT_BOX_PADDING * 2,
        () => {fill(0, 0, 30)},
        () => {queriedWR = "GD"},
        gdFill,
        color(0, 0, 80)
    )

    // display the header
    if (cardsToDisplay.length > 0) {
        translate(0, cellHeight)
        cardQueryShiftY += cellHeight

        displayHeader()
    }

    textSize(14)

    translate(0, cellHeight)

    // dictionary of card data: {cardName: ["gihWR", "gihGrade", "gihZ", "alsa"]
    let unsortedCardData = {}

    // right edge of data display
    let dataEdge = width - TEXT_BOX_PADDING

    for (let i=0; i < cardsToDisplay.length; i++) {
        textAlign(LEFT, TOP)

        let cardName = cardsToDisplay[i]


        if (masterJSON[cardName]["stats"][caliberQuery][colorPair]) {
            let data = masterJSON[cardName]["stats"][caliberQuery][colorPair]
            let winrate = data[`${queriedWR} WR`]
            let grade = data[`${queriedWR} grade`]
            let zScore = data[`${queriedWR} zscore`]
            let alsa = data[`ALSA`]
            let numPlayed = data[`# GIH`]

            unsortedCardData[cardName] = [winrate, grade, zScore, alsa, numPlayed]
        }
    }

    let cardData = Object.entries(unsortedCardData);

    // b[1][2] is the z-score of card B, a[1][2] is the z-score of card A
    cardData.sort((a, b) => {
        return b[1][2] - a[1][2]
    });

    if (Object.keys(unsortedCardData).length === 1) {
        let currentCard = Object.keys(unsortedCardData)[0]

        unsortedCardData = {}

        for (let pair of Object.keys(masterJSON[currentCard]["stats"][caliberQuery])) {
            let data = masterJSON[currentCard]["stats"][caliberQuery][pair]
            let winrate = data[`${queriedWR} WR`]
            let grade = data[`${queriedWR} grade`]
            let zScore = data[`${queriedWR} zscore`]
            let alsa = data[`ALSA`]
            let numPlayed = data[`# GIH`]

            pair = pair.toUpperCase()

            if (pair === "ALL") {
                pair = currentCard
            } else {
                alsa = "NaN"
            }

            unsortedCardData[pair] = [winrate, grade, zScore, alsa, numPlayed]
        }

        cardData = Object.entries(unsortedCardData)

        // moves the last element to the beginning of the list
        cardData.unshift(cardData.pop())
    }


    let grades = [
        'S ', 'A+', 'A ', 'A-', 'B+', 'B ', 'B-', 'C+', 'C ', 'C-', 'D+', 'D ', 'D-', 'F '
    ]

    for (let i=0; i<cardData.length; i++) {
        // structure of winrates: cardData[cardName] = [winrate, grade, zScore]
        let cardName = cardData[i][0]
        let winrates = cardData[i][1]

        let winrate = winrates[0]
        let grade = winrates[1]
        let zScore = winrates[2]
        let rawALSA = winrates[3]
        let numPlayed = winrates[4]

        textAlign(LEFT, TOP)
        // display card name
        noStroke()
        fill(0, 0, 80)
        paddedText(cardName, 0, cellHeight * (i + 1))

        textAlign(LEFT, TOP)
        // you have to give Jem Lightfoote, Sky Explorer some respect for
        // her very long card name.
        paddedText(
            numPlayed,
            textWidth(" ")*32 + 3*TEXT_BOX_PADDING,
            cellHeight * (i + 1)
        )

        // display alternating color rectangle
        noStroke()
        // this essentially alternates alpha between 0 and 20
        fill(0, 0, 100, (i + 1) % 2 * 5 + 5)

        // has to account for translations
        if (mouseX < width &&
            mouseY < cellHeight * (i+4) &&
            0 < mouseX &&
            cellHeight * (i+3) < mouseY &&
            !ifDisplayCard) {
            if (mouseJustReleased) {
                ifDisplayCard = true
                cardImgName = cardName
            }

            fill(0, 0, 100, 12)
        }

        rect(0, cellHeight * (i + 1),
            width, cellHeight
        )

        // get the first three digits and round everything else away
        let formattedWR = round(winrate * 1000)
        // after this, convert to a string
        formattedWR = str(formattedWR)
        // then add the decimal point
        formattedWR = formattedWR.slice(0, 2) + "." + formattedWR.slice(2)
        // finally, add the % at the end
        formattedWR += "%"

        // do the same for ALSA but without the % at the end
        // get the first three digits and round everything else away
        let ALSA

        if (rawALSA === "NaN") {
            ALSA = ""
        } else {
            ALSA = round(rawALSA * 100)
            ALSA = str(ALSA)
            ALSA = ALSA.slice(0, 1) + "." + ALSA.slice(1)
        }

        noStroke()
        fill(0, 0, 80)
        textAlign(RIGHT, TOP)
        text(formattedWR, dataEdge,
            cellHeight * (i + 1) + TEXT_BOX_PADDING)

        textAlign(LEFT, TOP)

        fill(137 - 11*grades.indexOf(grade), 82, 77)
        stroke(137 - 11*grades.indexOf(grade), 82, 77)
        strokeWeight(0.5)
        text(grade,
            dataEdge - ELEMENT_MARGIN - textWidth("GIH WR") - textWidth("grade"),
            cellHeight * (i + 1) + TEXT_BOX_PADDING
        )

        // greatly simplifies display expressions. currently accounts for
        // all text from the edge of the screen to the right edge of the
        // Z-score lines.
        let currentPos = dataEdge - ELEMENT_MARGIN*2 - textWidth("GIH WR")
        currentPos -= textWidth("1")/2 + textWidth("grade")

        // used for finding the 0 tick in the Z-score
        let zScoreRightEdge = currentPos

        stroke(0, 0, 60)
        strokeWeight(1)

        // handles Z-score lines
        for (let j=3; j >= -3; j--) {
            line(
                currentPos, cellHeight * (i + 1),
                currentPos, cellHeight * (i + 2)
            )
            currentPos -= ELEMENT_MARGIN
        }

        textAlign(LEFT, TOP)
        noStroke()
        fill(0, 0, 80)
        // not sure why the position has to be like this, but it works
        // better this way?
        text(ALSA, currentPos - ELEMENT_MARGIN - textWidth(" ")*7/2,
            cellHeight * (i + 1) + TEXT_BOX_PADDING)

        let zScoreLeftEdge = currentPos + ELEMENT_MARGIN

        // for testing purposes. keep this around
        // point(
        //     (zScoreRightEdge + zScoreLeftEdge)/2,
        //     ((cellHeight * (i + 1)) + (cellHeight * (i + 2)))/2
        //     )

        // map the Z-score to the specified range
        let mappedZ = constrain(zScore, -3, 3)
        mappedZ = map(mappedZ, -3, 3, zScoreLeftEdge, zScoreRightEdge)

        // display a line to the z-score, then a point at the score
        strokeWeight(2)
        stroke(0, 0, 60)
        line(
            (zScoreRightEdge + zScoreLeftEdge)/2,
            cellHeight*(i+1) + cellHeight/2,
            mappedZ,
            cellHeight*(i+1) + cellHeight/2
        )

        strokeWeight(5)
        stroke(0, 0, 80)
        point(
            mappedZ,
            cellHeight * (i + 1) + cellHeight/2
        )
    }

    pop()

    cardQueryShiftY = cellHeight*3 + cellHeight * cardData.length

    requiredHeight = cardQueryShiftY
}

// displays the interactive card querying module, which handles querying each
// card and the "query data" button
function cardQueryDisplay() {
    let textBoxWidth = textWidth(" ")*(MAX_QUERY_LENGTH+1)

    textAlign(LEFT, TOP)

    textFont(variableWidthFont, 14)
    let cellHeight = textHeight() + TEXT_BOX_PADDING*2

    fill(0, 0, 20)
    noStroke()
    // display a grayish box for the query to go in (assumes monospace font).
    // Also accounts for cursor.
    rect(0, 0,
        textBoxWidth + TEXT_BOX_PADDING*2,
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

    // iterate over all the queried cards
    for (let i = 0; i < queriedCardNames.length; i++) {
        let cardName = queriedCardNames[i]

        fill(0, 0, 40)

        // check if I'm hovering over this card name
        if (
            0 < mouseX &&
            cellHeight*(i+1) < mouseY &&
            mouseX < textBoxWidth + TEXT_BOX_PADDING*2 &&
            mouseY < cellHeight*(i+1) + textHeight() + TEXT_BOX_PADDING*2 &&
            !ifDisplayCard
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
        } else if (selectedIndex === i) {
            fill(0, 0, 30)

            if (enterJustPressed) {
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
                (0 < mouseX &&
                cellHeight*(i+1) < mouseY &&
                mouseX < textBoxWidth+TEXT_BOX_PADDING*2 &&
                mouseY < cellHeight*(i+1) + textHeight() + TEXT_BOX_PADDING*2)
                || selectedIndex === i &&
                !ifDisplayCard
            ) {
                fill(100, 60, 50)
            }
        }

        strokeWeight(1)
        stroke(0, 0, 0)
        rect(0,
            cellHeight*(i + 1),
            textBoxWidth + TEXT_BOX_PADDING*2,
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
            textBoxWidth + TEXT_BOX_PADDING*3,
            TEXT_BOX_PADDING + cellHeight*(i))
    }

    let longestListLength = max(queriedCardNames.length+1, selectedCards.length)

    requiredHeight = TEXT_BOX_PADDING + cellHeight*(longestListLength)

    // adds the "Query Data" button at the top.
    // note that "Query Data (WIP)" is displayed if I'm still working on it.

    textFont(font, 14)
    textAlign(LEFT, TOP)
    renderButton("Query Data",
        width - textWidth("Query Data") - TEXT_BOX_PADDING * 2, 0,
        textWidth("Query Data") + TEXT_BOX_PADDING * 2,
        textHeight() + TEXT_BOX_PADDING * 2,
        hoverQueryData,
        clickQueryData,
        color(0, 0, 40),
        color(0, 0, 80)
    )

    textAlign(LEFT, TOP)
    renderButton("Clear Query",
        width-textWidth("Query Data")-textWidth("Clear Query")-TEXT_BOX_PADDING*5,
        0,
        textWidth("Clear Query") + TEXT_BOX_PADDING * 2,
        textHeight() + TEXT_BOX_PADDING * 2,
        () => {fill(0, 0, 30)},
        () => {selectedCards = []; cardsToDisplay = []; query = ""},
        color(0, 0, 40),
        color(0, 0, 80)
    )
}

// onHover callback function for Query Data button
function hoverQueryData() {
    fill(0, 0, 30)
}

// onClick callback function for Query Data button, but can be called elsewhere
function clickQueryData() {
    cardsToDisplay = selectedCards.slice()

    for (let i = 0; i < selectedCards.length; i++) {
        let cardName = selectedCards[i]

        console.log(`${cardName}: ` +
            JSON.stringify(masterJSON[cardName], null, 2)
        )
    }

    statOrQueryDisplay = !statOrQueryDisplay
}


// displays a button. when clicked on, this function will use a callback
// function, which changes based on the button. May be incompatible with
// buttons that require local variables to function.
// x1 and y1 are the corner coordinates, w and h are the width and height.
// onClick is the previously described callback function.
// onHover is used to add hover effects while still allowing onClick to work
// rFill is the default fill for the rectangle, but is influenced by both
// onHover and onClick
// tFill is the standard text fill
function renderButton(text, x1, y1, w, h, onHover, onClick, rFill, tFill) {
    noStroke()
    fill(rFill)
    // handle hovering check. call the callback function
    if (
        x1 < mouseX &&
        y1 < mouseY &&
        mouseX < x1 + w &&
        mouseY < y1 + h &&
        !ifDisplayCard
    ) {
        onHover()

        if (mouseJustReleased) {
            onClick()
        }
    }
    // display a rect at the coordinates with width and height w and h.
    rect(x1, y1, w, h)

    noStroke()
    fill(tFill)
    paddedText(text, x1, y1)
}


// // turns a decimal winrate with a lot of digits into a clean, readable winrate
// // percentage like 64.2%. Takes in a float, returns a string
// function parseDecimalWinrate(decimalWR) {
//     // this isn't actually a winrate string
//     let winrateString = decimalWR * 1000
//
//     // this makes sure that if the decimal looks like 0.6400023, then the
//     // first decimal place still shows up as 0
//     winrateString = float(round(winrateString))
//     if (winrateString % 10 === 0) {
//         winrateString /= 10
//         winrateString = str(winrateString) + ".0" + "%"
//     } else {
//         winrateString /= 10
//         winrateString = str(winrateString) + "%"
//     }
//
//     return winrateString
// }


// load the associated card's card image
function displayCardImage(cardName) {
    // ensures that the screen is not darkened when the card image does not
    // exist
    if (cardPNGs[cardName]) {
        // darken the screen
        noStroke()
        fill(0, 0, 0, 50)
        rect(-1, -1, width+1, height+1)

        // check if the image is actually load it, then resize the canvas so
        // that it fits and display it
        if (!(cardPNGs[cardName] instanceof p5.Image))
            cardPNGs[cardName] = loadImage(cardPNGs[cardName])
        let img = cardPNGs[cardName]

        if (img) {
            requiredHeight = max(requiredHeight, 500)
            img.resize(0, 500)

            imageMode(CORNER)
            // centers the image on the canvas
            image(img, width/2 - img.width/2, height/2 - img.height/2)
        }
    } else {
        ifDisplayCard = false
    }
}


// displays text, but padded with a custom amount of padding. Default is
// TEXT_BOX_PADDING.
function paddedText(t, x, y, padding=TEXT_BOX_PADDING) {
    text(t, x + padding, y + padding)
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

    if (keyIsDown(CONTROL) && keyIsDown(ENTER)) {
        clickQueryData()
        ifDisplayCard = false
        return
    }

    // rather than deleting back to the last symbol/space, pressing
    // ctrlBackspace will simply delete all characters in the query.
    if (keyIsDown(CONTROL) && keyIsDown(BACKSPACE)) {
        query = ""
    }

    // if the user pressed anything other than a modifier key, modify the
    // query string accordingly. Otherwise, remove the last character from
    // the query. Also, if the length of the query exceeds the maximum
    // character cap, don't add the character.
    if (key !== "`" && key.length === 1 && query.length < MAX_QUERY_LENGTH && !statOrQueryDisplay) {
        query += key
        selectedIndex = 0
        ifDisplayCard = false
    } else if (keyCode === BACKSPACE){
        // delete the last element of query
        query = query.slice(0, -1)
        selectedIndex = 0
        ifDisplayCard = false
    }
    else if (keyCode === ENTER)
        enterJustPressed = true
    else if (keyCode === UP_ARROW)
        selectedIndex -= 1
    else if (keyCode === DOWN_ARROW)
        selectedIndex += 1

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

    selectedIndex = constrain(selectedIndex, 0, queriedCardNames.length-1)
}

// displays header for determining where data is displayed in cardDataDisplay
function displayHeader() {
    // simplifies positions
    let currentPos = 0

    fill(0, 0, 60)

    // name: left-aligned
    textAlign(LEFT, BOTTOM)

    // there are exactly 2 cells above the cards to display: the caliber
    // and color buttons, and the header
    text("name", TEXT_BOX_PADDING, cellHeight*2 - TEXT_BOX_PADDING/2)

    textAlign(LEFT, BOTTOM)
    text(
        "# played",
        textWidth(" ")*32 + 4*TEXT_BOX_PADDING,
        cellHeight*2 - TEXT_BOX_PADDING/2,
    )

    // GIH WR: right-aligned. although the header legend encompasses 6
    // characters, the actual winrate is 5 characters, so I have to be
    // careful about that.
    textAlign(RIGHT, BOTTOM)
    text(queriedWR + " WR", width - TEXT_BOX_PADDING, cellHeight*2 - TEXT_BOX_PADDING/2)
    currentPos += width - TEXT_BOX_PADDING - textWidth("GIH WR")

    // GIH grade: displayed as "grade". right-aligned as well?
    textAlign(RIGHT, BOTTOM)
    text("grade",
            (width - TEXT_BOX_PADDING) - ELEMENT_MARGIN - textWidth("GIH WR"),
        cellHeight*2 - TEXT_BOX_PADDING/2
    )
    currentPos -= ELEMENT_MARGIN + textWidth("grade")

    // GIH Z-score: centered text
    // should be done with a loop. iterates from 3 to -3
    for (let i=3; i >= -3; i--) {
        text(
            i,
            currentPos - ELEMENT_MARGIN,
            cellHeight*2 - TEXT_BOX_PADDING/2
        )

        currentPos -= ELEMENT_MARGIN
    }

    textAlign(RIGHT, BOTTOM)

    // ALSA: displayed as "alsa". right-aligned
    text("ALSA", currentPos - ELEMENT_MARGIN * 2, cellHeight*2 - TEXT_BOX_PADDING/2)
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
