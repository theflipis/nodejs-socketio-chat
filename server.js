var chatMultiApp = require('http').createServer(handleMultiChat);
var url = require('url');
var io = require('socket.io').listen(chatMultiApp);

chatMultiApp.listen(8056);

var connectedClients = [];
var userList = [];

function newMsg(socket, data)
{  
	if(connectedClients.hasOwnProperty(socket.id))
	{
    var clientFrom = connectedClients[socket.id];
		if(data.from == clientFrom.userName)
    {		   
				if(data.type == 'PRIVATE')
				{					
					for(client in connectedClients)
					{            
						if(connectedClients[client].userName == data.to)
						{
              console.log("data: " + data);
							connectedClients[client].socket.emit('msg', data);              
						}				
					}
				}
				else
				{
					socket.emit('msg', data);
					socket.broadcast.emit('msg', data);					
				}				
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
			debugData.users = connectedClients;
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
	connectedClients[idSocket].userName = userName;
}

function isUserNameAvailable(userName)
{
	for(var client in connectedClients)
	{
		if(connectedClients[client].userName == userName)
		{
			return false;			
		}
	}
	return true;
}

function makeUserList()
{
	userList = [];	
  var i = 0;
	for(var client in connectedClients)
	{    
		userList[i] = {"userName" : connectedClients[client].userName};
    i++;
	}	
}

io.sockets.on('connection', function(socket) {
	
	connectedClients[socket.id] = {};	
	connectedClients[socket.id].socket = socket;	
	
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
    if(connectedClients.hasOwnProperty(socket.id))
    {
      connectedClients[socket.id] = null;        
    }    
		makeUserList();
		socket.broadcast.emit('userList', userList);
	});	
});
