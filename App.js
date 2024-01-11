import React, { useState, useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      }
    }
  }

  const db = SQLite.openDatabase("db.db");
  return db;
}

const db = openDatabase();

export default function App() {
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedText, setEditedText] = useState("");

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, done int, value text);"
      );
    }, null, fetchItems);
  }, []);

  const fetchItems = () => {
    db.transaction((tx) => {
      tx.executeSql("select * from items", [], (_, { rows: { _array } }) => {
        setItems(_array);
      });
    });
  };

  const createItem = (text) => {
    if (text.trim() === "") {
      return;
    }

    db.transaction(
      (tx) => {
        tx.executeSql("insert into items (done, value) values (0, ?)", [text]);
      },
      null,
      () => {
        setText("");
        fetchItems();
      }
    );
  };

  const updateItemStatus = (id, done) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`update items set done = ? where id = ?`, [done ? 0 : 1, id]);
      },
      null,
      fetchItems
    );
  };

  const deleteItem = (id) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`delete from items where id = ?`, [id]);
      },
      null,
      fetchItems
    );
  };

  const startEditingItem = (id, text) => {
    setEditingItemId(id);
    setEditedText(text);
  };

  const saveEditedItem = (id) => {
    if (editedText.trim() === "") {
      return;
    }

    db.transaction(
      (tx) => {
        tx.executeSql(`update items set value = ? where id = ?`, [editedText, id]);
      },
      null,
      () => {
        setEditingItemId(null);
        setEditedText("");
        fetchItems();
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>TaskMaster</Text>
      <View style={styles.flexRow}>
        <TextInput
          onChangeText={(text) => setText(text)}
          onSubmitEditing={() => createItem(text)}
          placeholder="What do you need to do?"
          style={styles.input}
          value={text}
        />
      </View>
      <ScrollView style={styles.listArea}>
        {items.map(({ id, done, value }) => (
          <View key={id}>
            {editingItemId === id ? (
              <View style={styles.editItem}>
                <TextInput
                  value={editedText}
                  onChangeText={(text) => setEditedText(text)}
                  onBlur={() => saveEditedItem(id)}
                  autoFocus
                />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => updateItemStatus(id, done)}
                onLongPress={() => deleteItem(id)}
                style={{
                  backgroundColor: done ? "#000" : "#F3EFE0",
                  borderColor: "#000",
                  borderWidth: 1,
                  padding: 8,
                  marginBottom: 8,
                  marginLeft: 16,
                  marginRight: 16,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: done ? "#F3EFE0" : "#000" }}>{value}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => startEditingItem(id, value)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#F3EFE0",
    textShadowColor: "#FF10F0", // Warna bayangan (stroke)
    textShadowOffset: { width: 1, height: 1 }, // Ukuran dan arah bayangan
    textShadowRadius: 2, // Jarak bayangan
  },
  flexRow: {
    flexDirection: "row",
  },
  input: {
    borderColor: "#FF10F0",
    backgroundColor: "#F3EFE0",
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: 48,
    margin: 16,
    padding: 8,
  },
  listArea: {
    backgroundColor: "#F3EFE0",
    flex: 1,
    paddingTop: 16,
  },
  editItem: {
    backgroundColor: "#F3EFE0",
    borderColor: "#FF10F0",
    borderWidth: 1,
    padding: 8,
    marginBottom: 8,
    marginLeft: 16,
    marginRight: 16,
    borderRadius: 4,
  },
  editButton: {
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
});