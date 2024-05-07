//indexedDBの名前などの設定
const dbName = "subjectDB";
const storeName = "subjectStore";
const dbVersion = 1;

//データベース接続する。データベースが未作成なら新規作成する。
let database = indexedDB.open(dbName, dbVersion);

//データベースとオブジェクトストアの作成
database.onupgradeneeded = function (event) {
    let db = event.target.result;
    db.createObjectStore(storeName, { keyPath: "id" });
    console.log("データベースを新規作成しました");
}

//データベースに接続に成功した時に発生するイベント
database.onsuccess = function (event) {
    let db = event.target.result;
    // 接続を解除する
    db.close();
    console.log("データベースに接続できました");
}
database.onerror = function (event) {
    console.log("データベースに接続できませんでした");
}

//フォームの内容をDBに登録する
function regist() {
    //フォームの入力チェック。falseが返却されたら登録処理を中断
    if (inputCheck() == false) {
        return;
    }

    //ラジオボタンの取得
    let radio = document.getElementsByName("progress");
    let progress;
    for (let i = 0; i < radio.length; i++) {
        if (radio[i].checked == true) {
            progress = radio[i].value;
            break;
        }
    }

    //フォームに入力された値を取得
    let date = document.getElementById("date").value;
    let score = document.getElementById("score").value;
    let memo = document.getElementById("memo").value;
    let category = document.getElementById("category").value;
    

    //データベースにデータを登録する
    insertData(progress, date, category, score, memo);

    //入手金一覧を作成
    createList();
}

//データの挿入
function insertData(progress, date, category, score, memo) {
    //一意のIDを現在の日時から作成
    let uniqueID = new Date().getTime().toString();
    console.log(uniqueID);
    //DBに登録するための連想配列のデータを作成
    let data = {
        id: uniqueID,
        progress: progress,
        date: String(date),
        category: category,
        score: score,
        memo: memo,
    }

    //データベースを開く
    let database = indexedDB.open(dbName, dbVersion);

    //データベースの開けなかった時の処理
    database.onerror = function (event) {
        console.log("データベースに接続できませんでした");
    }

    //データベースを開いたらデータの登録を実行
    database.onsuccess = function (event) {
        let db = event.target.result;
        let transaction = db.transaction(storeName, "readwrite");
        transaction.oncomplete = function (event) {
            console.log("トランザクション完了");
        }
        transaction.onerror = function (event) {
            console.log("トランザクションエラー");
        }
        let store = transaction.objectStore(storeName);
        let addData = store.add(data);
        addData.onsuccess = function () {
            console.log("データが登録できました");
            alert("登録しました");
        }
        addData.onerror = function () {
            console.log("データが登録できませんでした");
        }
        db.close();
    }
}


function createList() {
    //データベースからデータを全件取得
    let database = indexedDB.open(dbName);
    database.onsuccess = function (event) {
        let db = event.target.result;
        let transaction = db.transaction(storeName, "readonly");
        let store = transaction.objectStore(storeName);

        store.getAll().onsuccess = function (data) {
            console.log(data);
            let rows = data.target.result;
            let section = document.getElementById("list");
            //科目一覧のテーブルを作る
            //バッククオートでヒアドキュメント
            let table = `
                <div class="table-responsive">
                <table class="table table-hover">
                    <tr>
                        <th>日付</th>
                        <th>進捗</th>
                        <th>授業</th>
                        <th>点数</th>
                        <th>メモ</th>
                        <th>削除
                    </th>
                </tr>
            `;
            //科目のデータを表示
            rows.forEach((element) => {
                console.log(element);
                table += `
                    <tr>
                        <td>${element.date}</td>
                        <td>${element.progress}</td>
                        <td>${element.category}</td>
                        <td>${element.score}</td>
                        <td>${element.memo}</td>
                        <td><button class="btn btn-outline-danger" onclick="deleteData('${element.id}')">×</button>
                        </td>
                    </tr>
                `;
            });
            table += `</table></div>`;
            section.innerHTML = table;

            //円グラフの作成
            createPieChart(rows);
        }
    }
}

//データの削除
function deleteData(id) {
    //データベースを開く
    let database = indexedDB.open(dbName, dbVersion);
    database.onupgradeneeded = function (event) {
        let db = event.target.result;
    }
    //開いたら削除実行
    database.onsuccess = function (event) {
        let db = event.target.result;
        let transaction = db.transaction(storeName, "readwrite");
        transaction.oncomplete = function (event) {
            console.log("トランザクション完了");
        }
        transaction.onerror = function (event) {
            console.log("トランザクションエラー");
        }
        let store = transaction.objectStore(storeName);
        let deleteData = store.delete(id);
        deleteData.onsuccess = function (event) {
            console.log("削除成功");
            createList();
        }
        deleteData.onerror = function (event) {
            console.log("削除失敗");
        }
        db.close();

    }
    //データベースの開けなかった時の処理
    database.onerror = function (event) {
        console.log("データベースに接続できませんでした");
    }
    
}
//ラジオボタンによりカテゴリを有効無効切り替え
function disableSelectBox(disabled) {
    document.getElementById("category").disabled = disabled;
}

//入力フォームの内容チェック
function inputCheck() {
    //チェック結果 true:入力チェックOK　false:未記入アリ
    let result = true;

    //選択したラジオボタンの取得
    let radio = document.getElementsByName("subject");
    let subject;
    for (let i = 0; i < radio.length; i++) {
        if (radio[i].checked == true) {
            subject = radio[i].value;
            break;
        }
    }

    //日付、科目、点数、メモの取得
    let date = document.getElementById("date").value;
    let category = document.getElementById("category").value;
    let score = document.getElementById("score").value;
    let memo = document.getElementById("memo").value;

    //入力チェック。未記入があればresultをfalseにする
    if (date == "") {
        result = false;
        alert("日付が未記入です");
    } else if (category == "-選択してください-") {
        result = false;
        alert("科目を選択してください");
    } else if (score == "" || score > 10) {
        result = false;
        alert("点数が未記入です");
    }
    return result;

}
function createPieChart(rows) {
    let pieChartData = {};

    // データベースからのデータをカテゴリ毎に集計
    rows.forEach(function (data) {
        let category = data.category;
        if (pieChartData[category] === undefined) {
            pieChartData[category] = 0;
        }
        pieChartData[category] += Number(data.score);
    });

    let keyArray = [];
    let valueArray = [];
    for (let key in pieChartData) {
        keyArray.push(key);
        valueArray.push(pieChartData[key]);
    }

    let pieChart = document.getElementById("pieChart");
    if (pieChart) {
        // レーダーチャートの生成
        new Chart(pieChart, {
            type: "radar",  // チャートタイプを "radar" に設定
            data: {
                labels: keyArray,
                datasets: [{
                    label: '得点',
                    backgroundColor: "rgba(179,181,198,0.2)",  // 背景色を半透明に設定
                    borderColor: "rgba(179,181,198,1)",  // 境界線の色
                    pointBackgroundColor: "rgba(179,181,198,1)",  // ポイントの背景色
                    pointBorderColor: "#fff",  // ポイントの境界線の色
                    pointHoverBackgroundColor: "#fff",  // ホバー時のポイント背景色
                    pointHoverBorderColor: "rgba(179,181,198,1)",  // ホバー時のポイント境界線色
                    data: valueArray,
                }],
            },
            options: {
                responsive: true,
                scale: {
                    angleLines: {
                        display: false  // 角度線を非表示にする
                    },
                    ticks: {
                        beginAtZero: true  // 目盛りは0から開始
                    }
                },
                title: {
                    display: true,
                    text: "授業毎の点数割合"
                },
            }
        });
    } else {
        console.error("Element #pieChart not found in the document.");
    }
}
