// Ta cần định nghĩa hàng chờ ưu tiên hàng chờ này sẽ có nhiệm vụ chứa các điểm và chi phí ước lượng tối thiểu của chúng
// để có thể dễ dàng lấy ra điểm có chi phí ước lượng nhỏ nhất trong quá trình tìm kiếm A*.

export interface QueueElement<T> {
  item: T;
  priority: number;
}

// dùng cấu trúc min-heap để triển khai hàng chờ ưu tiên từ đó lấy ra node có proiority nhỏ nhất một cách hiệu quả
export class MinPriorityQueue<T> {
  private heap: QueueElement<T>[] = [];

  // rút ra phần tử có priority nhỏ nhất (đỉnh của min-heap)
  public popMin(): QueueElement<T> | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop() as QueueElement<T>;
    this.sinkDown(0);

    return min;
  }

  public push(item: T, priority: number): void {
    this.heap.push({ item, priority });
    // vì thêm vào cuối bản nên sẽ kiểm tra cấu trúc từ cuối đi lên
    this.bubbleUp(this.heap.length - 1);
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number): void {
    const element = this.heap[index];
    while (index > 0) {
      // tìm ra node cha hiện tại của phần tử đang xét
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      // kiểm tra xem có thỏa điều kiện của min heap chưa
      if (element.priority >= parent.priority) break;
      this.heap[parentIndex] = element;
      this.heap[index] = parent;
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const element = this.heap[index];
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let leftChild: QueueElement<T> | undefined;
      let rightChild: QueueElement<T> | undefined;
      let swapIndex: null | number = null;
      // kiểm tra xem node con bên trái có tồn tại và có priority lớn hơn node cha không nếu nhỏ hơn thì lưu index của node con bên trái vào swapIndex
      if (leftChildIndex < length) {
        leftChild = this.heap[leftChildIndex];
        if (leftChild.priority < element.priority) {
          swapIndex = leftChildIndex;
        }
      }
      // làm tương tuej với node con bên phải nhưng lúc này ta sẽ kiểm tra xem IdexSwap có giá trị không nếu có thì hãy xem giá trị đó và nút con bên phải ai lớn hơn vì ta chỉ đổi chỗ nút cha với giá trị nhỏ nhấy
      if (rightChildIndex < length) {
        rightChild = this.heap[rightChildIndex];
        if (
          (swapIndex === null && rightChild.priority < element.priority) ||
          (swapIndex !== null &&
            leftChild &&
            rightChild.priority < leftChild.priority)
        ) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;
      this.heap[index] = this.heap[swapIndex];
      this.heap[swapIndex] = element;
      index = swapIndex;
    }
  }
}
