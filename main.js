let g = null

addEventListener('load', (e) => {
    g = document.querySelector('#front-grid')
    initial(g)
})


const initial = (g) => {
    const ROW = 4
    const COL = 4
    const grid = new Array(ROW * COL).fill(0).map((value, index) => ({
        value: 0,
        el: null,
        index: index,
        x: index % ROW,
        y: Math.floor(index / COL)
    }))
    const generateCell = () => {
        const emptyCells = grid.filter((value) => value.value === 0)
        const randomIndex = Math.floor(Math.random() * emptyCells.length)
        const cellData = emptyCells[randomIndex]
        cellData.value = Math.random() > 0.5 ? 2 : 4
        const cellEl = document.createElement('div')
        cellData.el = cellEl
        cellEl.style.width = '63px'
        cellEl.style.height = '63px'
        cellEl.style.transform = `translate(${cellData.x * 63 + cellData.x * 16}px,${cellData.y * 63 + cellData.y * 16}px)`
        cellEl.classList.add('front-grid-cell')
        cellEl.classList.add(`cell-${cellData.value}`)
        cellEl.innerText = cellData.value
        g.appendChild(cellEl)
    }
    generateCell()
    generateCell()
    console.log(grid);

    const getGridByDirection = (direction) => {
        const isX = direction === 'left' || direction === 'right'
        const isReverse = direction === 'right' || direction === 'down'
        return new Array(4).fill(0).map((value, index) => {
            let array = grid.filter((value) => (isX ? value.y : value.x) === index)
            isReverse && (array = array.reverse())
            return array
        })
    }

    const clearCell = (cell) => {
        cell.value = 0
        cell.el = null
    }

    const move = (direction) => {
        const allPromise = []
        const curGrid = getGridByDirection(direction)
        curGrid.forEach((array) => {
            let insertIndex = 0
            array.forEach((cell, index) => {
                if (cell.value !== 0 && index === insertIndex) {
                    insertIndex++
                } else if (cell.value !== 0 && index > insertIndex) {
                    const insertedCell = array[insertIndex]
                    insertedCell.value = cell.value
                    insertedCell.el = cell.el
                    clearCell(cell)
                    insertIndex++
                    const promise = insertedCell.el.animate([{
                        transform: `translate(${insertedCell.x * 63 + insertedCell.x * 16}px,${insertedCell.y * 63 + insertedCell.y * 16}px)`
                    }], {
                        duration: 100,
                        easing: 'ease-in-out',
                        fill: 'forwards'
                    })
                    allPromise.push(promise.finished)
                }
            })
        })
        return Promise.all(allPromise)
    }

    const merge = (direction) => {
        const allPromise = []
        const curGrid = getGridByDirection(direction)
        curGrid.forEach((array) => {
            let mergeArray = array.filter((cell) => cell.value)
            if (mergeArray.length < 2) return

            let l = 0
            let r = 1
            while (r < mergeArray.length) {
                const cellL = mergeArray[l]
                const cellR = mergeArray[r]
                if (cellL.value === cellR.value) {
                    cellL.el.classList.remove(`cell-${cellL.value}`)
                    cellL.value *= 2
                    cellL.el.classList.add(`cell-${cellL.value}`)
                    cellL.el.innerText = cellL.value
                    g.removeChild(cellR.el)
                    clearCell(cellR)
                    l += 2
                    r += 2
                } else {
                    l++
                    r++
                }
            }
        })
        return Promise.resolve()
    }

    let canOper = true
    useDirection(g, (direction) => {
        if (!canOper) return
        canOper = false
        move(direction)
            .then(() => merge(direction))
            .then(() => move(direction))
            .then(() => {
                generateCell()
                canOper = true
            })
    })
}

const useDirection = (g, cb) => {
    let startX = 0
    let startY = 0
    let direction
    g.addEventListener('touchstart', (e) => {
        e.cancelable && e.preventDefault();
        const { clientX, clientY } = e.changedTouches[0];
        [startX, startY] = [clientX, clientY]
    }, {
        passive: false
    })
    g.addEventListener('touchend', (e) => {
        e.cancelable && e.preventDefault();
        const { clientX, clientY } = e.changedTouches[0]
        let [x, y] = [startX - clientX, startY - clientY]
        if (Math.abs(x) < 1 && Math.abs(y) < 1) return
        direction = Math.abs(x) > Math.abs(y)
            ? x < 0
                ? 'right'
                : 'left'
            : y < 0
                ? 'down'
                : 'up'
        cb(direction)
    }, {
        passive: false
    })
    addEventListener('keyup', (e) => {
        const { code } = e
        if (code === 'KeyW' || code === 'ArrowUp') {
            direction = 'up'
        } else if (code === 'KeyS' || code === 'ArrowDown') {
            direction = 'down'
        } else if (code === 'KeyA' || code === 'ArrowLeft') {
            direction = 'left'
        } else if (code === 'KeyD' || code === 'ArrowRight') {
            direction = 'right'
        } else {
            direction = null
        }
        direction && cb(direction)
    })

    const getDirection = () => direction
    return {
        getDirection
    }
} 
