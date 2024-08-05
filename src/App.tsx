import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const App = () => {
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newExpense, setNewExpense] = useState({ payer: '', amount: '', description: '', split: [] });

  useEffect(() => {
    const savedGroups = localStorage.getItem('splitwiseGroups');
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('splitwiseGroups', JSON.stringify(groups));
  }, [groups]);

  const createGroup = () => {
    if (newGroupName.trim()) {
      const newGroup = { name: newGroupName, members: [], expenses: [] };
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setCurrentGroup(newGroup);
    }
  };

  const addMember = () => {
    if (newMemberName.trim() && currentGroup) {
      const updatedGroup = { ...currentGroup, members: [...currentGroup.members, newMemberName] };
      updateGroup(updatedGroup);
      setNewMemberName('');
    }
  };

  const addExpense = () => {
    if (currentGroup && newExpense.payer && newExpense.amount && newExpense.description) {
      const updatedGroup = {
        ...currentGroup,
        expenses: [...currentGroup.expenses, { ...newExpense, split: newExpense.split.length ? newExpense.split : currentGroup.members }]
      };
      updateGroup(updatedGroup);
      setNewExpense({ payer: '', amount: '', description: '', split: [] });
    }
  };

  const updateGroup = (updatedGroup) => {
    setGroups(groups.map(g => g.name === updatedGroup.name ? updatedGroup : g));
    setCurrentGroup(updatedGroup);
  };

  const calculateBalances = () => {
    if (!currentGroup) return {};

    const balances = {};
    currentGroup.members.forEach(member => {
      balances[member] = {};
      currentGroup.members.forEach(otherMember => {
        if (member !== otherMember) {
          balances[member][otherMember] = 0;
        }
      });
    });

    currentGroup.expenses.forEach(expense => {
      const payer = expense.payer;
      const amount = parseFloat(expense.amount);
      const splitMembers = expense.split;
      const splitAmount = amount / splitMembers.length;

      splitMembers.forEach(member => {
        if (member !== payer) {
          balances[member][payer] += splitAmount;
          balances[payer][member] -= splitAmount;
        }
      });
    });

    // Simplify balances
    currentGroup.members.forEach(member => {
      currentGroup.members.forEach(otherMember => {
        if (member !== otherMember) {
          if (balances[member][otherMember] > 0 && balances[otherMember][member] > 0) {
            const diff = balances[member][otherMember] - balances[otherMember][member];
            if (diff > 0) {
              balances[member][otherMember] = diff;
              balances[otherMember][member] = 0;
            } else {
              balances[otherMember][member] = -diff;
              balances[member][otherMember] = 0;
            }
          }
        }
      });
    });

    return balances;
  };

  const renderBalances = () => {
    const balances = calculateBalances();
    return Object.entries(balances).map(([member, owes]) => (
      <div key={member} className="mb-2">
        <strong>{member}</strong>:
        {Object.entries(owes).map(([to, amount]) => (
          amount !== 0 && (
            <div key={to} className="ml-4">
              {amount > 0 ? `Owes ${to}: $${amount.toFixed(2)}` : `Is owed by ${to}: $${(-amount).toFixed(2)}`}
            </div>
          )
        ))}
      </div>
    ));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Splitwise-like App</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Create New Group</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name"
            />
            <Button onClick={createGroup}>Create Group</Button>
          </div>
        </CardContent>
      </Card>

      {currentGroup && (
        <>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{currentGroup.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Members</h3>
              <ul className="list-disc list-inside mb-4">
                {currentGroup.members.map((member, index) => (
                  <li key={index}>{member}</li>
                ))}
              </ul>
              <div className="flex space-x-2 mb-4">
                <Input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Enter member name"
                />
                <Button onClick={addMember}>Add Member</Button>
              </div>
              <h3 className="text-lg font-semibold mb-2">Add Expense</h3>
              <div className="space-y-2">
                <Input
                  type="text"
                  value={newExpense.payer}
                  onChange={(e) => setNewExpense({...newExpense, payer: e.target.value})}
                  placeholder="Payer"
                />
                <Input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  placeholder="Amount"
                />
                <Input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  placeholder="Description"
                />
                <div>
                  <p className="mb-2">Split between (leave empty for all):</p>
                  {currentGroup.members.map((member, index) => (
                    <label key={index} className="flex items-center space-x-2 mb-1">
                      <input
                        type="checkbox"
                        checked={newExpense.split.includes(member)}
                        onChange={(e) => {
                          const updatedSplit = e.target.checked
                            ? [...newExpense.split, member]
                            : newExpense.split.filter(m => m !== member);
                          setNewExpense({...newExpense, split: updatedSplit});
                        }}
                      />
                      <span>{member}</span>
                    </label>
                  ))}
                </div>
                <Button onClick={addExpense}>Add Expense</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {currentGroup.expenses.map((expense, index) => (
                <Alert key={index} className="mb-2">
                  <AlertTitle>{expense.description}</AlertTitle>
                  <AlertDescription>
                    Paid by {expense.payer}: ${expense.amount}
                    <br />
                    Split between: {expense.split.join(', ')}
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Balances</CardTitle>
            </CardHeader>
            <CardContent>
              {renderBalances()}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default App;