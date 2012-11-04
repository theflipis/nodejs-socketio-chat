var chatMultiApp = require('http').createServer(handleMultiChat);
var url = require('url');
var io = require('socket.io').listen(chatMultiApp);

chatMultiApp.listen(8056);

var connectedClients = [];
var nConnected = 0;
var userList = [];

function newMsg(socket, data)
{	
	for(var j = 0; j < nConnected; j++)
	{
		if(socket.id == connectedClients[j].id &&
		   data.from == connectedClients[j].userName)
		   {		   
				if(data.type == 'PRIVATE')
				{					
					for(var i = 0; i < nConnected; i++)
					{
						if(connectedClients[i].userName == data.to)
						{
							connectedClients[i].socket.emit('msg', data);
              break;
						}				
					}
				}
				else
				{
					socket.emit('msg', data);
					socket.broadcast.emit('msg', data);					
				}
				break;
		  }
	 }
}

function handleMultiChat(request, response)
{
	var args = url.parse(request.url, true);
	var queryString = args.query;
  
  if(request.url == "/login")
  {
    response.end("TODO... SOON... ");    
  }
	
	if(queryString.hasOwnProperty("user"))
	{
		if(queryString.user == "test" && queryString.pass == "test")
		{
			response.writeHead(200);
			var debugData = {};
			debugData.users = nConnected;
			debugData.userNames = userList;			
			response.end(JSON.stringify(debugData));
		}		
	}
	else
	{    
		response.writeHead(404);
		response.end("404 NOT FOUND");
	}
}

function assignUserName(userName, idSocket)
{
	for(var i = 0; i < nConnected; i++)
	{
		if(idSocket == connectedClients[i].id)
		{
			connectedClients[i].userName = userName;			
		}		
	}	
}

function isUserNameAvailable(userName)
{
	for(var i = 0; i < userList.length; i++)
	{
		if(userList[i].userName == userName)
		{
			return false;			
		}
	}
	return true;
}

function makeUserList()
{
	userList = [];	
	for(var i = 0; i < nConnected; i++)
	{
		userList[i] = {"userName" : connectedClients[i].userName};
	}	
}

io.sockets.on('connection', function(socket) {
	
	connectedClients[nConnected] = {};
	connectedClients[nConnected].id = socket.id;
	connectedClients[nConnected].socket = socket;	
	nConnected++;
	
	socket.on('authData', function(data) {
		if(isUserNameAvailable(data.userName) == true)
		{
			userList.push({"userName" : data.userName});
			assignUserName(data.userName, socket.id);
			socket.emit('userList', userList);
			socket.broadcast.emit('userList', userList);
		}
		else
		{
			socket.emit('authData', {"isAvailable" : false});			
		}
	});
	
	socket.on('msg', function(data) {		
		newMsg(socket, data);		
	});
	
	socket.on('disconnect', function(data) {		
		for(var i = 0; i < nConnected; i++)
		{
			if(connectedClients[i].id == socket.id)
			{				
				connectedClients.splice(i, 1);
				nConnected--;				
				break;
			}
		}
		makeUserList();
		socket.broadcast.emit('userList', userList);
	});	
});
