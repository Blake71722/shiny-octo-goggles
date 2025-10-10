document.addEventListener("DOMContentLoaded", function () {
  const cells = document.querySelectorAll('.cell');
  function addRandomTile() {
    const empty = Array.from(cells).filter(cell => cell.textContent === "");
    if (empty.length === 0) return;
    const randCell = empty[Math.floor(Math.random() * empty.length)];
    randCell.textContent = "2";
  }
  addRandomTile();
});
