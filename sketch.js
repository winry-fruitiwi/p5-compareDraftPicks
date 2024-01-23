/**
 *  @author Winry
 *  @date 2024.1.14
 *
 *  Hello! I am Winry of the Nubcake Bakery, an unofficial team of four raiding
 *  buddies who do criterion dungeons in Final Fantasy XIV Endwalker.
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

/* constants */
// the padding of the text box
const TEXT_BOX_PADDING = 4
// maximum characters allowed in the query
const MAX_QUERY_LENGTH = 32


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
    rectMode(CORNER)
    background(0, 0, 9)

    textAlign(LEFT, TOP)

    fill(0, 0, 20)
    noStroke()
    // display a grayish box for the query to go in (assumes monospace font).
    // Also accounts for cursor.
    rect(0, 0,
        textWidth(" ")*(MAX_QUERY_LENGTH+1) + TEXT_BOX_PADDING*2,
        textAscent() + textDescent() + TEXT_BOX_PADDING*2
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

        fill(0, 33*i, 50)
        rect(0,
            TEXT_BOX_PADDING + (textAscent()+textDescent()+TEXT_BOX_PADDING)*(i + 1),
            textWidth(" ")*(MAX_QUERY_LENGTH+1) + TEXT_BOX_PADDING*2,
            textAscent() + textDescent() + TEXT_BOX_PADDING*2
            )

        fill(0, 0, 80)
        text(cardName,
            TEXT_BOX_PADDING,
            TEXT_BOX_PADDING + (textAscent()+textDescent()+TEXT_BOX_PADDING)*(i+1))
    }

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    debugCorner.showBottom()

    if (frameCount > 3000)
        noLoop()
}


function keyPressed() {
    console.clear()
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

    for (let card of Object.keys(queriedCards))
        print(card)

    queriedCardNames = Object.keys(queriedCards)
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
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

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
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

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
